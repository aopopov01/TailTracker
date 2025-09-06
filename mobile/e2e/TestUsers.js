const TestUsers = {
  PREMIUM: {
    email: 'premium@tailtracker.com',
    password: 'PremiumUser123!',
    firstName: 'Premium',
    lastName: 'User',
    subscriptionType: 'premium'
  },
  
  FREE: {
    email: 'free@tailtracker.com',
    password: 'FreeUser123!',
    firstName: 'Free',
    lastName: 'User',
    subscriptionType: 'free'
  },
  
  ADMIN: {
    email: 'admin@tailtracker.com',
    password: 'AdminUser123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  }
};

module.exports = TestUsers;