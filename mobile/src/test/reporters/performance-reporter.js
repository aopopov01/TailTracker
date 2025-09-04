const fs = require('fs');
const path = require('path');

// Custom Performance Test Reporter for TailTracker
class TailTrackerPerformanceReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options || {};
    this.performanceData = [];
    this.thresholds = {
      COMPONENT_RENDER: 100, // 100ms
      SCREEN_NAVIGATION: 300, // 300ms
      API_CALL: 2000, // 2 seconds
      IMAGE_LOAD: 1000, // 1 second
      SEARCH_FILTER: 200, // 200ms
      LIST_SCROLL: 16, // 16ms for 60fps
      NOTIFICATION_DISPLAY: 500, // 500ms
    };
  }

  onRunStart() {
    console.log('🚀 Starting TailTracker Performance Tests...\n');
    this.startTime = Date.now();
  }

  onTestStart(test) {
    // Store test start time
    if (!this.testStartTimes) {
      this.testStartTimes = new Map();
    }
    this.testStartTimes.set(test.path, Date.now());
  }

  onTestResult(test, testResult) {
    const startTime = this.testStartTimes?.get(test.path);
    const duration = startTime ? Date.now() - startTime : 0;

    // Extract performance metrics from test results
    const performanceMetrics = this.extractPerformanceMetrics(testResult);
    
    if (performanceMetrics.length > 0) {
      this.performanceData.push({
        testFile: path.relative(process.cwd(), test.path),
        testName: testResult.testResults[0]?.ancestorTitles[0] || 'Unknown',
        duration,
        metrics: performanceMetrics,
        timestamp: new Date().toISOString(),
        passed: testResult.numFailingTests === 0,
      });
    }
  }

  onRunComplete(contexts, results) {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('\n📊 Performance Test Results Summary');
    console.log('=====================================');
    
    // Generate comprehensive performance report
    const report = this.generatePerformanceReport(totalDuration);
    
    // Check performance thresholds
    const thresholdResults = this.checkPerformanceThresholds(report);
    
    // Generate HTML report
    this.generateHtmlReport(report, thresholdResults);
    
    // Generate JSON report for CI/CD
    this.generateJsonReport(report, thresholdResults);
    
    // Log results to console
    this.logPerformanceResults(report, thresholdResults);
    
    // Generate performance trends
    this.generatePerformanceTrends(report);
    
    console.log(`\n⏱️  Total test execution time: ${totalDuration}ms`);
    console.log('=====================================\n');
    
    // Fail if critical performance thresholds are exceeded
    if (!thresholdResults.passed && this.options.failOnThreshold !== false) {
      console.error('❌ Critical performance thresholds exceeded');
      process.exit(1);
    }
  }

  extractPerformanceMetrics(testResult) {
    const metrics = [];
    
    // Look for performance data in console output
    if (testResult.console) {
      testResult.console.forEach(logEntry => {
        if (logEntry.message.includes('Performance Metric:')) {
          try {
            const metricData = JSON.parse(
              logEntry.message.replace('Performance Metric:', '').trim()
            );
            metrics.push(metricData);
          } catch (e) {
            // Ignore invalid JSON
          }
        }
      });
    }

    // Extract timing data from test results
    testResult.testResults.forEach(test => {
      if (test.duration) {
        metrics.push({
          name: test.title,
          type: 'test_execution',
          duration: test.duration,
          status: test.status,
        });
      }
    });

    return metrics;
  }

  generatePerformanceReport(totalDuration) {
    const report = {
      summary: {
        totalTests: this.performanceData.length,
        totalDuration,
        averageTestDuration: totalDuration / Math.max(this.performanceData.length, 1),
        passedTests: this.performanceData.filter(test => test.passed).length,
        failedTests: this.performanceData.filter(test => !test.passed).length,
      },
      categories: {},
      slowestTests: [],
      fastestTests: [],
      thresholdViolations: [],
      trends: {},
    };

    // Categorize metrics by type
    this.performanceData.forEach(testData => {
      testData.metrics.forEach(metric => {
        const category = metric.type || 'unknown';
        if (!report.categories[category]) {
          report.categories[category] = {
            count: 0,
            totalDuration: 0,
            averageDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
            metrics: [],
          };
        }

        const cat = report.categories[category];
        cat.count++;
        cat.totalDuration += metric.duration;
        cat.minDuration = Math.min(cat.minDuration, metric.duration);
        cat.maxDuration = Math.max(cat.maxDuration, metric.duration);
        cat.metrics.push({
          ...metric,
          testFile: testData.testFile,
          testName: testData.testName,
        });
      });
    });

    // Calculate averages
    Object.keys(report.categories).forEach(category => {
      const cat = report.categories[category];
      cat.averageDuration = cat.totalDuration / cat.count;
      
      // Fix infinity values
      if (cat.minDuration === Infinity) {
        cat.minDuration = 0;
      }
    });

    // Find slowest and fastest tests
    const allTests = this.performanceData
      .map(test => ({ ...test, avgMetricDuration: this.getAverageMetricDuration(test.metrics) }))
      .sort((a, b) => b.avgMetricDuration - a.avgMetricDuration);

    report.slowestTests = allTests.slice(0, 5);
    report.fastestTests = allTests.slice(-5).reverse();

    return report;
  }

  checkPerformanceThresholds(report) {
    const results = {
      passed: true,
      violations: [],
      warnings: [],
      summary: {},
    };

    // Check each category against thresholds
    Object.keys(report.categories).forEach(category => {
      const categoryData = report.categories[category];
      const thresholdKey = category.toUpperCase();
      const threshold = this.thresholds[thresholdKey];

      if (threshold) {
        const passed = categoryData.averageDuration <= threshold;
        const critical = categoryData.maxDuration > threshold * 2;

        results.summary[category] = {
          average: categoryData.averageDuration,
          max: categoryData.maxDuration,
          threshold,
          passed,
          critical,
          violationCount: categoryData.metrics.filter(m => m.duration > threshold).length,
        };

        if (!passed || critical) {
          const violation = {
            category,
            threshold,
            average: categoryData.averageDuration,
            max: categoryData.maxDuration,
            critical,
            violatingTests: categoryData.metrics
              .filter(m => m.duration > threshold)
              .slice(0, 3), // Top 3 violations
          };

          if (critical) {
            results.violations.push(violation);
            results.passed = false;
          } else {
            results.warnings.push(violation);
          }
        }
      }
    });

    return results;
  }

  generateHtmlReport(report, thresholdResults) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TailTracker Performance Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .title { color: #2d3748; font-size: 28px; font-weight: 700; margin: 0; }
        .subtitle { color: #718096; font-size: 16px; margin: 10px 0 0 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-card { text-align: center; }
        .metric-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #718096; font-size: 14px; text-transform: uppercase; }
        .status-good { color: #38a169; }
        .status-warning { color: #d69e2e; }
        .status-critical { color: #e53e3e; }
        .chart-container { position: relative; height: 300px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f7fafc; font-weight: 600; }
        .violation-badge { background: #fed7d7; color: #c53030; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .warning-badge { background: #faf5dc; color: #d69e2e; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .good-badge { background: #c6f6d5; color: #38a169; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🚀 TailTracker Performance Report</h1>
            <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="grid">
            <div class="card metric-card">
                <div class="metric-value status-${thresholdResults.passed ? 'good' : 'critical'}">${report.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="card metric-card">
                <div class="metric-value">${Math.round(report.summary.totalDuration)}ms</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="card metric-card">
                <div class="metric-value">${Math.round(report.summary.averageTestDuration)}ms</div>
                <div class="metric-label">Avg Test Duration</div>
            </div>
            <div class="card metric-card">
                <div class="metric-value status-${report.summary.passedTests === report.summary.totalTests ? 'good' : 'warning'}">
                    ${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%
                </div>
                <div class="metric-label">Pass Rate</div>
            </div>
        </div>

        ${thresholdResults.violations.length > 0 ? `
        <div class="card">
            <h3>❌ Critical Performance Issues</h3>
            ${thresholdResults.violations.map(v => `
                <div style="margin-bottom: 15px; padding: 15px; background: #fed7d7; border-left: 4px solid #e53e3e; border-radius: 4px;">
                    <strong>${v.category}</strong>: Average ${Math.round(v.average)}ms (threshold: ${v.threshold}ms)
                    <br>Max: ${Math.round(v.max)}ms
                    <br>Violating tests: ${v.violatingTests.length}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="card">
            <h3>📊 Performance Categories</h3>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Count</th>
                        <th>Average</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Threshold</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(report.categories).map(category => {
                      const cat = report.categories[category];
                      const summary = thresholdResults.summary[category];
                      const status = summary ? (summary.critical ? 'critical' : summary.passed ? 'good' : 'warning') : 'good';
                      const threshold = this.thresholds[category.toUpperCase()] || 'N/A';
                      
                      return `
                        <tr>
                            <td><strong>${category}</strong></td>
                            <td>${cat.count}</td>
                            <td>${Math.round(cat.averageDuration)}ms</td>
                            <td>${Math.round(cat.minDuration)}ms</td>
                            <td>${Math.round(cat.maxDuration)}ms</td>
                            <td>${threshold === 'N/A' ? 'N/A' : threshold + 'ms'}</td>
                            <td><span class="${status}-badge">${status.toUpperCase()}</span></td>
                        </tr>
                      `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🐌 Slowest Tests</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Test</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.slowestTests.map(test => `
                            <tr>
                                <td>${test.testName}</td>
                                <td>${Math.round(test.avgMetricDuration)}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h3>🚀 Fastest Tests</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Test</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.fastestTests.map(test => `
                            <tr>
                                <td>${test.testName}</td>
                                <td>${Math.round(test.avgMetricDuration)}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>`;

    const outputPath = path.join(process.cwd(), 'mobile/coverage/performance-report.html');
    fs.writeFileSync(outputPath, html);
    console.log(`📊 Performance HTML report generated: ${outputPath}`);
  }

  generateJsonReport(report, thresholdResults) {
    const jsonReport = {
      timestamp: new Date().toISOString(),
      summary: report.summary,
      thresholds: this.thresholds,
      results: thresholdResults,
      categories: report.categories,
      slowestTests: report.slowestTests.slice(0, 10),
      fastestTests: report.fastestTests.slice(0, 10),
      rawData: this.performanceData,
    };

    const outputPath = path.join(process.cwd(), 'mobile/coverage/performance-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(jsonReport, null, 2));
    console.log(`📊 Performance JSON report generated: ${outputPath}`);
  }

  logPerformanceResults(report, thresholdResults) {
    console.log(`📊 Performance Summary:`);
    console.log(`   Total Tests: ${report.summary.totalTests}`);
    console.log(`   Total Duration: ${Math.round(report.summary.totalDuration)}ms`);
    console.log(`   Average Test Duration: ${Math.round(report.summary.averageTestDuration)}ms`);
    console.log(`   Pass Rate: ${Math.round((report.summary.passedTests / report.summary.totalTests) * 100)}%`);
    
    console.log('\n📈 Category Performance:');
    Object.keys(report.categories).forEach(category => {
      const cat = report.categories[category];
      const summary = thresholdResults.summary[category];
      const status = summary ? (summary.critical ? '❌' : summary.passed ? '✅' : '⚠️') : '✅';
      const threshold = this.thresholds[category.toUpperCase()];
      
      console.log(`   ${status} ${category.padEnd(20)}: ${Math.round(cat.averageDuration).toString().padStart(6)}ms avg, ${Math.round(cat.maxDuration).toString().padStart(6)}ms max (${cat.count} tests)${threshold ? ` [threshold: ${threshold}ms]` : ''}`);
    });

    if (thresholdResults.violations.length > 0) {
      console.log('\n❌ Critical Performance Issues:');
      thresholdResults.violations.forEach(violation => {
        console.log(`   - ${violation.category}: ${Math.round(violation.average)}ms avg (threshold: ${violation.threshold}ms)`);
        console.log(`     Max: ${Math.round(violation.max)}ms, ${violation.violatingTests.length} violating tests`);
      });
    }

    if (thresholdResults.warnings.length > 0) {
      console.log('\n⚠️  Performance Warnings:');
      thresholdResults.warnings.forEach(warning => {
        console.log(`   - ${warning.category}: ${Math.round(warning.average)}ms avg (threshold: ${warning.threshold}ms)`);
      });
    }

    if (report.slowestTests.length > 0) {
      console.log('\n🐌 Slowest Tests:');
      report.slowestTests.slice(0, 3).forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.testName}: ${Math.round(test.avgMetricDuration)}ms`);
      });
    }
  }

  generatePerformanceTrends(report) {
    // This would typically compare with historical data
    // For now, just save current data for future comparison
    const trendsPath = path.join(process.cwd(), 'mobile/coverage/performance-trends.json');
    
    let trends = [];
    if (fs.existsSync(trendsPath)) {
      try {
        trends = JSON.parse(fs.readFileSync(trendsPath, 'utf8'));
      } catch (e) {
        trends = [];
      }
    }

    trends.push({
      timestamp: new Date().toISOString(),
      summary: report.summary,
      categories: Object.keys(report.categories).reduce((acc, key) => {
        acc[key] = {
          count: report.categories[key].count,
          averageDuration: report.categories[key].averageDuration,
          maxDuration: report.categories[key].maxDuration,
        };
        return acc;
      }, {}),
    });

    // Keep only last 50 entries
    trends = trends.slice(-50);
    
    fs.writeFileSync(trendsPath, JSON.stringify(trends, null, 2));
    console.log(`📈 Performance trends updated: ${trendsPath}`);
  }

  getAverageMetricDuration(metrics) {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }
}

module.exports = TailTrackerPerformanceReporter;