# TailTracker Deployment Runbook
## Production Deployment and Operations Guide

### Overview
This runbook provides comprehensive guidance for deploying and operating TailTracker in production environments, ensuring 99.9% uptime and operational excellence.

### Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedures](#deployment-procedures)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring and Alerting](#monitoring-and-alerting)
6. [Incident Response](#incident-response)
7. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

### Infrastructure Readiness
- [ ] AWS infrastructure provisioned and healthy
- [ ] EKS cluster operational with all node groups
- [ ] RDS PostgreSQL database accessible and backed up
- [ ] Redis cluster operational
- [ ] S3 buckets configured with proper permissions
- [ ] CloudFront distribution healthy
- [ ] Route 53 DNS configured
- [ ] SSL certificates valid and not expiring soon

### Application Readiness
- [ ] All unit tests passing (>95% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing on staging
- [ ] Performance tests completed (API <1s response time)
- [ ] Security scans completed with no critical issues
- [ ] Feature flags configured for gradual rollout
- [ ] Database migrations tested and ready

### Monitoring and Alerting
- [ ] Prometheus metrics collection active
- [ ] Grafana dashboards operational
- [ ] ELK stack ingesting logs properly
- [ ] Sentry error tracking configured
- [ ] New Relic APM active
- [ ] PagerDuty integration tested
- [ ] Slack notifications configured

### Team Readiness
- [ ] On-call engineer identified and available
- [ ] Deployment lead confirmed
- [ ] Stakeholders notified of deployment window
- [ ] Rollback plan reviewed and approved
- [ ] Emergency contacts list updated

## Deployment Procedures

### Standard Deployment Process

#### 1. Pre-Deployment Setup
```bash
# Verify kubectl context
kubectl config current-context

# Verify infrastructure status
terraform plan -var-file="production.tfvars"

# Check cluster health
kubectl get nodes
kubectl get pods --all-namespaces

# Verify monitoring systems
curl -f http://prometheus:9090/-/healthy
curl -f http://grafana:3000/api/health
```

#### 2. Database Migration
```bash
# Backup current database
kubectl create job db-backup-$(date +%Y%m%d%H%M) \
  --from=cronjob/db-backup

# Verify backup completion
kubectl logs job/db-backup-$(date +%Y%m%d%H%M)

# Run migrations in dry-run mode
kubectl run migration-dry-run \
  --image=tailtracker-api:latest \
  --rm -i --tty \
  --env="DRY_RUN=true" \
  -- npm run migrate

# Run actual migrations
kubectl run migration \
  --image=tailtracker-api:latest \
  --rm -i --tty \
  -- npm run migrate

# Verify migration success
kubectl logs migration
```

#### 3. API Deployment (Canary)
```bash
# Deploy canary version
kubectl apply -f k8s/api-canary-deployment.yaml

# Verify canary pods are ready
kubectl wait --for=condition=ready pod \
  -l app=tailtracker-api,version=canary \
  --timeout=300s

# Start traffic routing (5% initially)
kubectl apply -f k8s/api-virtual-service-5percent.yaml

# Monitor canary health for 10 minutes
for i in {1..10}; do
  echo "Health check $i/10"
  curl -f https://api.tailtracker.com/health
  sleep 60
done

# Gradually increase traffic
kubectl apply -f k8s/api-virtual-service-25percent.yaml
# Wait 10 minutes and monitor
kubectl apply -f k8s/api-virtual-service-50percent.yaml
# Wait 10 minutes and monitor
kubectl apply -f k8s/api-virtual-service-100percent.yaml

# Complete deployment
kubectl apply -f k8s/api-stable-deployment.yaml
kubectl delete deployment tailtracker-api-canary
```

#### 4. Mobile App Deployment
```bash
# iOS App Store deployment
cd mobile
eas submit --platform ios --profile production

# Android Play Store deployment
eas submit --platform android --profile production

# Verify submissions
eas submission:list --platform all
```

#### 5. Frontend Deployment (if applicable)
```bash
# Build and deploy frontend
npm run build:production
aws s3 sync dist/ s3://tailtracker-frontend-prod

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123EXAMPLE \
  --paths "/*"
```

### Automated Deployment (GitHub Actions)

The primary deployment method uses GitHub Actions:

1. **Create Release Tag**
   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin v1.2.3
   ```

2. **Monitor Deployment**
   - Check GitHub Actions workflow progress
   - Monitor Slack #deployments channel
   - Watch Grafana deployment dashboard

3. **Verify Deployment**
   - Use automated smoke tests
   - Check application metrics
   - Verify no critical alerts

## Post-Deployment Verification

### Automated Verification
```bash
# Run smoke tests
./scripts/smoke-tests.sh production

# Check API endpoints
curl -f https://api.tailtracker.com/health
curl -f https://api.tailtracker.com/ready

# Verify database connectivity
kubectl run db-test --rm -i --tty \
  --image=postgres:15 \
  -- psql $DATABASE_URL -c "SELECT 1"
```

### Manual Verification Checklist
- [ ] Application loads correctly
- [ ] User registration works
- [ ] Pet profile creation works
- [ ] Lost pet alert creation works
- [ ] Push notifications functioning
- [ ] Payment processing operational
- [ ] Maps and location services working

### Performance Verification
- [ ] API response times <1s (95th percentile)
- [ ] Error rate <0.1%
- [ ] Database query performance acceptable
- [ ] CDN cache hit rate >90%
- [ ] Mobile app startup time <3s

### Security Verification
- [ ] SSL certificates valid
- [ ] Security headers present
- [ ] API rate limiting active
- [ ] Authentication working properly
- [ ] Authorization checks in place

## Rollback Procedures

### Immediate Rollback (Emergency)
```bash
# Quick rollback using kubectl
kubectl rollout undo deployment/tailtracker-api

# Verify rollback
kubectl rollout status deployment/tailtracker-api

# Route all traffic to stable version
kubectl apply -f k8s/api-virtual-service-0percent.yaml
```

### Complete Rollback
```bash
# 1. Stop canary deployment
kubectl delete deployment tailtracker-api-canary

# 2. Rollback database migrations (if needed)
kubectl run migration-rollback \
  --image=tailtracker-api:previous \
  --rm -i --tty \
  -- npm run migrate:rollback

# 3. Rollback application deployment
kubectl set image deployment/tailtracker-api \
  tailtracker-api=tailtracker-api:previous-stable

# 4. Verify rollback
kubectl rollout status deployment/tailtracker-api

# 5. Update monitoring and feature flags
# Disable new features in feature flag service
# Update Grafana annotations with rollback event
```

### Mobile App Rollback
```bash
# iOS - Submit previous version or remove from sale
# Android - Rollback using Play Console staged rollouts
# Update minimum version requirements if needed
```

## Monitoring and Alerting

### Key Metrics to Monitor

#### System Metrics
- CPU usage <80%
- Memory usage <85%
- Disk usage <85%
- Network I/O within normal ranges

#### Application Metrics
- API response time (95th percentile) <1s
- Error rate <0.1%
- Throughput matching expected levels
- Database connection pool utilization <80%

#### Business Metrics
- User registration rate
- Pet profile creation rate
- Lost pet alert creation rate
- Payment processing success rate
- App store ratings and reviews

### Alert Thresholds

#### Critical Alerts (PagerDuty)
- API error rate >5%
- Database unavailable
- All API instances down
- Payment processing failure rate >10%
- Security breach indicators

#### Warning Alerts (Slack)
- API response time >2s
- Error rate >1%
- High CPU/Memory usage
- Low cache hit rates
- Elevated user complaints

### Monitoring Dashboards
- **Executive Dashboard**: High-level business metrics
- **Operations Dashboard**: System health and performance
- **SLA Dashboard**: Uptime and performance SLAs
- **Security Dashboard**: Security events and compliance
- **Mobile Dashboard**: App-specific metrics

## Incident Response

### Incident Classification

#### Severity 1 (Critical)
- Complete service outage
- Data breach or security incident
- Payment processing down
- Critical functionality broken for >25% users

**Response Time**: 15 minutes
**Escalation**: Immediate PagerDuty alert

#### Severity 2 (High)
- Partial service degradation
- Performance issues affecting user experience
- Non-critical functionality broken
- Error rate >5%

**Response Time**: 30 minutes
**Escalation**: Slack alert + email

#### Severity 3 (Medium)
- Minor performance issues
- Non-user-facing component issues
- Monitoring alert anomalies

**Response Time**: 2 hours
**Escalation**: Slack alert

### Incident Response Process

1. **Detection**
   - Automated monitoring alerts
   - User reports
   - Partner notifications

2. **Assessment**
   - Determine severity level
   - Identify affected systems
   - Estimate user impact

3. **Response**
   - Alert appropriate team members
   - Begin investigation
   - Implement temporary mitigations

4. **Resolution**
   - Identify root cause
   - Implement permanent fix
   - Verify resolution

5. **Post-Incident**
   - Conduct post-mortem
   - Update documentation
   - Implement preventive measures

### Emergency Contacts
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Engineering Manager**: +1-XXX-XXX-XXXX
- **CTO**: +1-XXX-XXX-XXXX
- **AWS Support**: Enterprise Support Portal
- **Supabase Support**: support@supabase.io

## Troubleshooting

### Common Issues and Solutions

#### API Deployment Issues

**Issue**: Pods not starting
```bash
# Check pod events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check resource limits
kubectl top pod <pod-name>
```

**Issue**: Database connection failures
```bash
# Verify database endpoint
nslookup database-endpoint

# Check database status
kubectl run db-check --rm -i --tty \
  --image=postgres:15 \
  -- pg_isready -h $DB_HOST

# Review connection pool settings
kubectl get configmap api-config -o yaml
```

#### Performance Issues

**Issue**: High response times
1. Check database slow query logs
2. Review Redis cache hit rates
3. Analyze API endpoint performance in New Relic
4. Check for resource constraints

**Issue**: High error rates
1. Review error logs in ELK stack
2. Check Sentry for error details
3. Verify external API dependencies
4. Review recent code changes

#### Database Issues

**Issue**: Migration failures
```bash
# Check migration status
kubectl run migration-status --rm -i --tty \
  --image=tailtracker-api:latest \
  -- npm run migrate:status

# Review migration logs
kubectl logs <migration-job>

# Manual migration rollback if needed
kubectl run migration-manual --rm -i --tty \
  --image=tailtracker-api:latest \
  -- npm run migrate:rollback
```

#### Mobile App Issues

**Issue**: App crashes
1. Review crash logs in Firebase/App Center
2. Check for API compatibility issues
3. Verify third-party service status
4. Review recent app updates

**Issue**: Push notifications not working
1. Verify Firebase configuration
2. Check notification service logs
3. Test notification endpoints
4. Review user notification permissions

### Performance Tuning

#### Database Optimization
- Review slow query logs daily
- Optimize frequently used queries
- Update table statistics regularly
- Monitor connection pool usage

#### Cache Optimization
- Monitor Redis memory usage
- Review cache hit rates
- Optimize cache key strategies
- Set appropriate TTLs

#### API Optimization
- Profile API endpoints regularly
- Optimize database queries
- Implement efficient caching
- Review rate limiting settings

### Capacity Planning

#### Scaling Triggers
- CPU usage consistently >70%
- Memory usage consistently >80%
- Request queue depth >100
- Response time degradation

#### Scaling Actions
```bash
# Scale API deployment
kubectl scale deployment tailtracker-api --replicas=10

# Scale worker nodes
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name eks-workers \
  --desired-capacity 5

# Scale database (vertical scaling)
aws rds modify-db-instance \
  --db-instance-identifier tailtracker-prod \
  --db-instance-class db.r5.xlarge
```

### Security Procedures

#### Security Incident Response
1. Isolate affected systems
2. Preserve evidence
3. Notify security team
4. Begin forensic analysis
5. Communicate with stakeholders
6. Implement remediation
7. Conduct post-incident review

#### Regular Security Tasks
- Review access logs weekly
- Update security patches monthly
- Conduct security scans quarterly
- Review access permissions quarterly
- Test incident response procedures semi-annually

### Disaster Recovery

#### Backup Procedures
- Database backups: Daily automated
- Configuration backups: After each change
- Code backups: Git repositories with redundancy
- Infrastructure state: Terraform state in S3

#### Recovery Procedures
1. Assess extent of disaster
2. Activate disaster recovery plan
3. Restore from backups
4. Verify system functionality
5. Resume normal operations
6. Conduct post-disaster review

### Communication Templates

#### Status Page Update
```
[INVESTIGATING] We're currently investigating reports of [issue description]. 
We'll provide updates as we learn more.
Last updated: [timestamp]
```

#### Incident Notification
```
INCIDENT: [Severity Level] - [Brief Description]
Impact: [User impact description]
Status: [Investigating/Identified/Monitoring/Resolved]
ETA: [Expected resolution time]
Updates: [Link to status page]
```

#### Resolution Notification
```
RESOLVED: [Brief description]
The issue has been resolved as of [timestamp].
Root cause: [Brief explanation]
Next steps: [Any required user actions]
```

This runbook should be reviewed and updated quarterly to ensure accuracy and completeness.