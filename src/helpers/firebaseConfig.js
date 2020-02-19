
const production = {
  apiKey: 'apiKey',
  authDomain: 'authDomain',
  databaseURL: 'databaseURL',
  projectId: 'projectId',
  storageBucket: 'storageBucket',
  messagingSenderId: 'messagingSenderId',
  appId: 'appId',
};

// firebase use testing # sets environment to the testing alias

const testing = {
  apiKey: 'apiKey',
  authDomain: 'authDomain',
  databaseURL: 'databaseURL',
  projectId: 'projectId',
  storageBucket: 'storageBucket',
  messagingSenderId: 'messagingSenderId',
  appId: 'appId',
};

let setup = {};
// const workingOn = 'production';
const workingOn = 'testing';

if (workingOn == 'production') {
  setup = production;
} else if (workingOn == 'testing') {
  setup = testing;
}

export const config = setup;
export const env = workingOn;