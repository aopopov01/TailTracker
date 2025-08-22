module.exports = {
  files: [
    {
      path: 'dist/android/index.android.bundle',
      maxSize: '2MB',
      compression: 'gzip'
    },
    {
      path: 'dist/ios/main.jsbundle', 
      maxSize: '2MB',
      compression: 'gzip'
    }
  ],
  ci: {
    trackBranches: ['main', 'develop'],
    repoBranchBase: 'main',
    githubAccessToken: process.env.GITHUB_TOKEN,
    normalizeFilenames: /^(.*?)(?:\?.*?)?$/
  },
  defaultCompression: 'gzip'
};