#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PhotoStack } from '../lib/photo-stack';  

const app = new cdk.App();
new PhotoStack(app, 'PhotoStack', {           
  env: { region: 'eu-west-1' }                 
});
