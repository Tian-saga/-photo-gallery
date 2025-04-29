import os
import re
import json
import logging
import boto3


ddb = boto3.resource('dynamodb').Table(os.environ['TABLE'])
s3  = boto3.client('s3')


OK_RE = re.compile(r'.*\.(jpe?g|png)$', re.IGNORECASE)

log = logging.getLogger()
log.setLevel(logging.INFO)

def handler(event, context):
   
    for sqs_rec in event['Records']:
     
        body = json.loads(sqs_rec['body'])
        for s3_rec in body.get('Records', []):
            key = s3_rec['s3']['object']['key']
            
        
            if not OK_RE.match(key):
                log.error("invalid filetype: %s", key)
              
                raise ValueError("bad extension")

         
            ddb.put_item(Item={"id": key})
            log.info("logged %s", key)
