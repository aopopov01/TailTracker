// TailTracker Canary Deployment System
// Intelligent gradual rollout with automated rollback capabilities

const { exec } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');

const execAsync = promisify(exec);

class TailTrackerCanaryDeployment extends EventEmitter {
  constructor(config) {
    super();
    
    this.environment = config.environment || 'production';
    this.namespace = config.namespace || 'default';
    this.deploymentName = config.deploymentName || 'tailtracker-api';
    this.kubeconfig = config.kubeconfig;
    
    // Canary deployment configuration
    this.canaryConfig = {
      initialTrafficPercentage: config.initialTrafficPercentage || 5,
      trafficIncrements: config.trafficIncrements || [5, 10, 25, 50, 75, 100],
      incrementIntervalMinutes: config.incrementIntervalMinutes || 10,
      maxRolloutTimeMinutes: config.maxRolloutTimeMinutes || 120,
      
      // Health check thresholds
      healthCheck: {
        successRateThreshold: config.successRateThreshold || 0.99,
        errorRateThreshold: config.errorRateThreshold || 0.01,
        latencyP95Threshold: config.latencyP95Threshold || 1000, // ms
        minRequestsPerMinute: config.minRequestsPerMinute || 10
      },
      
      // Rollback triggers
      rollbackTriggers: {
        errorRateSpike: config.errorRateSpike || 0.05,
        latencyIncrease: config.latencyIncrease || 2.0, // 2x increase
        healthCheckFailures: config.healthCheckFailures || 3,
        criticalAlertsThreshold: config.criticalAlertsThreshold || 2
      }
    };

    // Monitoring integrations
    this.monitoring = {
      prometheusUrl: config.prometheusUrl,
      grafanaUrl: config.grafanaUrl,
      sentryDsn: config.sentryDsn
    };

    // State tracking
    this.deploymentState = {
      status: 'idle', // idle, deploying, monitoring, rolling-back, completed, failed
      currentTrafficPercentage: 0,
      deploymentStartTime: null,
      currentVersion: null,
      targetVersion: null,
      healthCheckResults: [],
      rollbackReason: null
    };

    this.healthCheckInterval = null;
    this.rolloutTimer = null;
  }

  // Main deployment orchestration
  async startCanaryDeployment(newVersion, imageUri) {
    try {
      console.log(`Starting canary deployment for ${newVersion}`);
      
      this.deploymentState = {
        ...this.deploymentState,
        status: 'deploying',
        deploymentStartTime: new Date(),
        currentVersion: await this.getCurrentVersion(),
        targetVersion: newVersion,
        currentTrafficPercentage: 0,
        healthCheckResults: [],
        rollbackReason: null
      };

      this.emit('deployment_started', {
        version: newVersion,
        image: imageUri,
        config: this.canaryConfig
      });

      // Step 1: Deploy canary version
      await this.deployCanaryVersion(newVersion, imageUri);
      
      // Step 2: Start health monitoring
      this.startHealthMonitoring();
      
      // Step 3: Begin gradual traffic routing
      await this.beginTrafficRollout();
      
      return {
        success: true,
        message: 'Canary deployment started successfully',
        deploymentId: this.generateDeploymentId()
      };

    } catch (error) {
      console.error('Failed to start canary deployment:', error);
      await this.handleDeploymentFailure(error);
      throw error;
    }
  }

  async deployCanaryVersion(version, imageUri) {
    try {
      console.log(`Deploying canary version ${version}`);

      // Create canary deployment manifest
      const canaryManifest = this.generateCanaryManifest(version, imageUri);
      
      // Apply canary deployment
      await this.applyKubernetesManifest(canaryManifest);
      
      // Wait for canary pods to be ready
      await this.waitForCanaryReady(version);
      
      // Create canary service
      const canaryService = this.generateCanaryService(version);
      await this.applyKubernetesManifest(canaryService);

      console.log(`Canary version ${version} deployed successfully`);
      this.emit('canary_deployed', { version, imageUri });

    } catch (error) {
      console.error('Failed to deploy canary version:', error);
      throw error;
    }
  }

  async beginTrafficRollout() {
    try {
      this.deploymentState.status = 'monitoring';
      
      for (const targetPercentage of this.canaryConfig.trafficIncrements) {
        if (this.deploymentState.status !== 'monitoring') {
          console.log('Deployment stopped or failed, aborting traffic rollout');
          return;
        }

        console.log(`Routing ${targetPercentage}% traffic to canary`);
        
        // Update traffic routing
        await this.updateTrafficRouting(targetPercentage);
        this.deploymentState.currentTrafficPercentage = targetPercentage;
        
        this.emit('traffic_updated', {
          percentage: targetPercentage,
          version: this.deploymentState.targetVersion
        });

        // Wait for increment interval while monitoring health
        await this.waitWithHealthChecks(this.canaryConfig.incrementIntervalMinutes * 60 * 1000);
        
        // Check if we should proceed
        const shouldContinue = await this.evaluateCanaryHealth();
        if (!shouldContinue) {
          console.log('Health checks failed, initiating rollback');
          await this.initiateRollback('health_check_failure');
          return;
        }

        // If we've reached 100%, complete the deployment
        if (targetPercentage === 100) {
          await this.completeDeployment();
          return;
        }
      }

    } catch (error) {
      console.error('Error during traffic rollout:', error);
      await this.initiateRollback('rollout_error');
    }
  }

  async updateTrafficRouting(percentage) {
    try {
      // Update Istio VirtualService or Ingress weights
      const virtualService = this.generateVirtualService(percentage);
      await this.applyKubernetesManifest(virtualService);
      
      // Give time for traffic routing to take effect
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    } catch (error) {
      console.error('Failed to update traffic routing:', error);
      throw error;
    }
  }

  startHealthMonitoring() {
    console.log('Starting health monitoring');
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check error:', error);
      }
    }, 60000); // Every minute

    // Set maximum rollout time
    this.rolloutTimer = setTimeout(async () => {
      console.log('Maximum rollout time exceeded, initiating rollback');
      await this.initiateRollback('timeout_exceeded');
    }, this.canaryConfig.maxRolloutTimeMinutes * 60 * 1000);
  }

  async performHealthCheck() {
    try {
      const healthResult = {
        timestamp: new Date(),
        metrics: {}
      };

      // Check API success rate
      const successRate = await this.getCanarySuccessRate();
      healthResult.metrics.successRate = successRate;

      // Check error rate
      const errorRate = await this.getCanaryErrorRate();
      healthResult.metrics.errorRate = errorRate;

      // Check latency
      const latencyP95 = await this.getCanaryLatencyP95();
      healthResult.metrics.latencyP95 = latencyP95;

      // Check request volume
      const requestsPerMinute = await this.getCanaryRequestsPerMinute();
      healthResult.metrics.requestsPerMinute = requestsPerMinute;

      // Check pod health
      const podHealth = await this.getCanaryPodHealth();
      healthResult.metrics.podHealth = podHealth;

      // Check critical alerts
      const criticalAlerts = await this.getCriticalAlerts();
      healthResult.metrics.criticalAlerts = criticalAlerts;

      this.deploymentState.healthCheckResults.push(healthResult);
      
      // Keep only last 10 health check results
      if (this.deploymentState.healthCheckResults.length > 10) {
        this.deploymentState.healthCheckResults.shift();
      }

      this.emit('health_check_completed', healthResult);

      // Check for rollback triggers
      await this.checkRollbackTriggers(healthResult);

    } catch (error) {
      console.error('Health check failed:', error);
      this.emit('health_check_failed', error);
    }
  }

  async evaluateCanaryHealth() {
    const recentResults = this.deploymentState.healthCheckResults.slice(-3); // Last 3 checks
    
    if (recentResults.length === 0) {
      console.log('No health check results available');
      return false;
    }

    const avgSuccessRate = recentResults.reduce((sum, r) => sum + (r.metrics.successRate || 0), 0) / recentResults.length;
    const avgErrorRate = recentResults.reduce((sum, r) => sum + (r.metrics.errorRate || 0), 0) / recentResults.length;
    const avgLatency = recentResults.reduce((sum, r) => sum + (r.metrics.latencyP95 || 0), 0) / recentResults.length;
    const avgRequests = recentResults.reduce((sum, r) => sum + (r.metrics.requestsPerMinute || 0), 0) / recentResults.length;

    const thresholds = this.canaryConfig.healthCheck;
    
    const healthyMetrics = {
      successRate: avgSuccessRate >= thresholds.successRateThreshold,
      errorRate: avgErrorRate <= thresholds.errorRateThreshold,
      latency: avgLatency <= thresholds.latencyP95Threshold,
      volume: avgRequests >= thresholds.minRequestsPerMinute
    };

    const isHealthy = Object.values(healthyMetrics).every(Boolean);

    console.log('Canary health evaluation:', {
      avgSuccessRate: avgSuccessRate.toFixed(4),
      avgErrorRate: avgErrorRate.toFixed(4),
      avgLatency: avgLatency.toFixed(2),
      avgRequests: avgRequests.toFixed(0),
      healthyMetrics,
      isHealthy
    });

    this.emit('health_evaluated', {
      metrics: { avgSuccessRate, avgErrorRate, avgLatency, avgRequests },
      healthyMetrics,
      isHealthy
    });

    return isHealthy;
  }

  async checkRollbackTriggers(healthResult) {
    const triggers = this.canaryConfig.rollbackTriggers;
    let rollbackReason = null;

    // Check error rate spike
    if (healthResult.metrics.errorRate > triggers.errorRateSpike) {
      rollbackReason = `Error rate spike: ${healthResult.metrics.errorRate.toFixed(4)} > ${triggers.errorRateSpike}`;
    }

    // Check latency increase (compare with baseline)
    const baselineLatency = await this.getBaselineLatency();
    if (baselineLatency && healthResult.metrics.latencyP95 > baselineLatency * triggers.latencyIncrease) {
      rollbackReason = `Latency increase: ${healthResult.metrics.latencyP95}ms > ${baselineLatency * triggers.latencyIncrease}ms`;
    }

    // Check critical alerts
    if (healthResult.metrics.criticalAlerts >= triggers.criticalAlertsThreshold) {
      rollbackReason = `Critical alerts: ${healthResult.metrics.criticalAlerts} >= ${triggers.criticalAlertsThreshold}`;
    }

    // Check consecutive health check failures
    const recentResults = this.deploymentState.healthCheckResults.slice(-triggers.healthCheckFailures);
    const allFailed = recentResults.length === triggers.healthCheckFailures && 
      recentResults.every(r => r.metrics.successRate < this.canaryConfig.healthCheck.successRateThreshold);

    if (allFailed) {
      rollbackReason = `Consecutive health check failures: ${triggers.healthCheckFailures}`;
    }

    if (rollbackReason) {
      console.log(`Rollback trigger activated: ${rollbackReason}`);
      await this.initiateRollback(rollbackReason);
    }
  }

  async initiateRollback(reason) {
    try {
      console.log(`Initiating rollback: ${reason}`);
      
      this.deploymentState.status = 'rolling-back';
      this.deploymentState.rollbackReason = reason;

      this.emit('rollback_started', { reason });

      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.rolloutTimer) {
        clearTimeout(this.rolloutTimer);
      }

      // Route all traffic back to stable version
      await this.updateTrafficRouting(0);
      
      // Remove canary deployment
      await this.removeCanaryDeployment();
      
      this.deploymentState.status = 'failed';
      this.deploymentState.currentTrafficPercentage = 0;

      this.emit('rollback_completed', { reason });

      console.log(`Rollback completed: ${reason}`);

    } catch (error) {
      console.error('Rollback failed:', error);
      this.emit('rollback_failed', error);
      throw error;
    }
  }

  async completeDeployment() {
    try {
      console.log('Completing canary deployment');
      
      // Clear intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.rolloutTimer) {
        clearTimeout(this.rolloutTimer);
      }

      // Replace stable deployment with canary version
      await this.promoteCanaryToStable();
      
      // Remove canary resources
      await this.cleanupCanaryResources();

      this.deploymentState.status = 'completed';
      this.deploymentState.currentTrafficPercentage = 100;

      this.emit('deployment_completed', {
        version: this.deploymentState.targetVersion,
        duration: new Date() - this.deploymentState.deploymentStartTime
      });

      console.log(`Canary deployment completed successfully: ${this.deploymentState.targetVersion}`);

    } catch (error) {
      console.error('Failed to complete deployment:', error);
      await this.initiateRollback('completion_error');
      throw error;
    }
  }

  async waitWithHealthChecks(duration) {
    const startTime = Date.now();
    const checkInterval = 30000; // 30 seconds

    while (Date.now() - startTime < duration) {
      if (this.deploymentState.status !== 'monitoring') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }

  // Kubernetes operations
  async applyKubernetesManifest(manifest) {
    const manifestFile = `/tmp/manifest-${Date.now()}.yaml`;
    require('fs').writeFileSync(manifestFile, manifest);

    const { stdout, stderr } = await execAsync(`kubectl apply -f ${manifestFile}`);
    
    if (stderr && !stderr.includes('Warning')) {
      throw new Error(`kubectl apply failed: ${stderr}`);
    }

    return stdout;
  }

  async waitForCanaryReady(version) {
    const deploymentName = `${this.deploymentName}-canary`;
    const command = `kubectl wait --for=condition=available --timeout=300s deployment/${deploymentName} -n ${this.namespace}`;
    
    await execAsync(command);
    console.log(`Canary deployment ${version} is ready`);
  }

  async getCurrentVersion() {
    try {
      const { stdout } = await execAsync(`kubectl get deployment ${this.deploymentName} -n ${this.namespace} -o jsonpath='{.metadata.labels.version}'`);
      return stdout.trim();
    } catch (error) {
      console.warn('Could not get current version:', error.message);
      return 'unknown';
    }
  }

  // Manifest generators
  generateCanaryManifest(version, imageUri) {
    return `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${this.deploymentName}-canary
  namespace: ${this.namespace}
  labels:
    app: ${this.deploymentName}
    version: ${version}
    deployment-type: canary
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${this.deploymentName}
      version: ${version}
  template:
    metadata:
      labels:
        app: ${this.deploymentName}
        version: ${version}
        deployment-type: canary
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: ${this.deploymentName}
        image: ${imageUri}
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: VERSION
          value: "${version}"
        - name: DEPLOYMENT_TYPE
          value: "canary"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
`;
  }

  generateCanaryService(version) {
    return `
apiVersion: v1
kind: Service
metadata:
  name: ${this.deploymentName}-canary
  namespace: ${this.namespace}
  labels:
    app: ${this.deploymentName}
    version: ${version}
spec:
  selector:
    app: ${this.deploymentName}
    version: ${version}
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: ClusterIP
`;
  }

  generateVirtualService(canaryPercentage) {
    const stablePercentage = 100 - canaryPercentage;
    
    return `
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${this.deploymentName}
  namespace: ${this.namespace}
spec:
  hosts:
  - ${this.deploymentName}
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: ${this.deploymentName}-canary
      weight: 100
  - route:
    - destination:
        host: ${this.deploymentName}
      weight: ${stablePercentage}
    - destination:
        host: ${this.deploymentName}-canary
      weight: ${canaryPercentage}
`;
  }

  // Monitoring queries (these would need to be adapted to your actual Prometheus setup)
  async getCanarySuccessRate() {
    const query = `rate(http_requests_total{job="${this.deploymentName}-canary",status!~"5.."}[5m]) / rate(http_requests_total{job="${this.deploymentName}-canary"}[5m])`;
    return await this.queryPrometheus(query);
  }

  async getCanaryErrorRate() {
    const query = `rate(http_requests_total{job="${this.deploymentName}-canary",status=~"5.."}[5m]) / rate(http_requests_total{job="${this.deploymentName}-canary"}[5m])`;
    return await this.queryPrometheus(query);
  }

  async getCanaryLatencyP95() {
    const query = `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="${this.deploymentName}-canary"}[5m])) * 1000`;
    return await this.queryPrometheus(query);
  }

  async getCanaryRequestsPerMinute() {
    const query = `rate(http_requests_total{job="${this.deploymentName}-canary"}[1m]) * 60`;
    return await this.queryPrometheus(query);
  }

  async getCanaryPodHealth() {
    const query = `up{job="${this.deploymentName}-canary"}`;
    return await this.queryPrometheus(query);
  }

  async getCriticalAlerts() {
    const query = `count(ALERTS{alertname!="",severity="critical",job=~".*${this.deploymentName}-canary.*"})`;
    return await this.queryPrometheus(query);
  }

  async getBaselineLatency() {
    const query = `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="${this.deploymentName}"}[5m])) * 1000`;
    return await this.queryPrometheus(query);
  }

  async queryPrometheus(query) {
    try {
      if (!this.monitoring.prometheusUrl) {
        console.warn('Prometheus URL not configured, returning mock data');
        return Math.random(); // Mock data for demo
      }

      const url = `${this.monitoring.prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success' && data.data.result.length > 0) {
        return parseFloat(data.data.result[0].value[1]);
      }

      return 0;
    } catch (error) {
      console.error('Prometheus query failed:', error);
      return 0;
    }
  }

  // Cleanup operations
  async removeCanaryDeployment() {
    try {
      await execAsync(`kubectl delete deployment ${this.deploymentName}-canary -n ${this.namespace}`);
      await execAsync(`kubectl delete service ${this.deploymentName}-canary -n ${this.namespace}`);
    } catch (error) {
      console.warn('Error removing canary deployment:', error.message);
    }
  }

  async promoteCanaryToStable() {
    // Update the main deployment with the canary image
    const command = `kubectl patch deployment ${this.deploymentName} -n ${this.namespace} -p '{"spec":{"template":{"metadata":{"labels":{"version":"${this.deploymentState.targetVersion}"}},"spec":{"containers":[{"name":"${this.deploymentName}","image":"${this.getCurrentCanaryImage()}"}]}}}}'`;
    await execAsync(command);
  }

  async cleanupCanaryResources() {
    await this.removeCanaryDeployment();
    
    // Reset virtual service to route 100% to stable
    const virtualService = this.generateVirtualService(0);
    await this.applyKubernetesManifest(virtualService);
  }

  async getCurrentCanaryImage() {
    const { stdout } = await execAsync(`kubectl get deployment ${this.deploymentName}-canary -n ${this.namespace} -o jsonpath='{.spec.template.spec.containers[0].image}'`);
    return stdout.trim();
  }

  async handleDeploymentFailure(error) {
    this.deploymentState.status = 'failed';
    this.deploymentState.rollbackReason = error.message;
    
    this.emit('deployment_failed', error);
    
    // Cleanup any partial deployment
    await this.removeCanaryDeployment().catch(() => {});
  }

  generateDeploymentId() {
    return `${this.deploymentState.targetVersion}-${Date.now()}`;
  }

  // Status and reporting
  getDeploymentStatus() {
    return {
      ...this.deploymentState,
      healthCheckCount: this.deploymentState.healthCheckResults.length,
      lastHealthCheck: this.deploymentState.healthCheckResults.slice(-1)[0] || null
    };
  }

  // Cleanup
  cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.rolloutTimer) {
      clearTimeout(this.rolloutTimer);
    }
  }
}

module.exports = TailTrackerCanaryDeployment;