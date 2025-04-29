import os, json, boto3

ddb    = boto3.resource('dynamodb')
table  = ddb.Table(os.environ['TABLE'])

s3     = boto3.client('s3')
bucket = os.environ['BUCKET']

def handler(event, _):
    for rec in event['Records']:

        outer = json.loads(rec['body'])

   
        key = outer['requestPayload']['Records'][0]['s3']['object']['key']

        status = 'error'
        reason = outer['responsePayload'].get('errorMessage', 'unknown')

      
        try:
            s3.delete_object(Bucket=bucket, Key=key)
        except s3.exceptions.NoSuchKey:
            pass

        
        table.update_item(
            Key={'id': key},
            UpdateExpression='SET #s = :s, reason = :r',
            ExpressionAttributeNames={'#s': 'status'},
            ExpressionAttributeValues={':s': status, ':r': reason}
        )
