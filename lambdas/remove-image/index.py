import os, json, boto3
s3 = boto3.client('s3')

def handler(event, _):
    bucket = os.environ['BUCKET']
    for rec in event['Records']:
        key = json.loads(rec['body'])['s3']['object']['key']
        s3.delete_object(Bucket=bucket, Key=key)
