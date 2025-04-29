import os, re, json, logging, boto3

s3   = boto3.client('s3')
ddb  = boto3.resource('dynamodb').Table(os.environ['TABLE'])
OK_RE = re.compile(r'.*\.(jpe?g|png)$', re.I)

log = logging.getLogger()
log.setLevel(logging.INFO)

def handler(event, _):

    for sqs_rec in event["Records"]:
        body = json.loads(sqs_rec["body"])         
        for s3_rec in body["Records"]:              
            key = s3_rec["s3"]["object"]["key"]

            if not OK_RE.match(key):
                log.error("invalid filetype: %s", key)
                raise ValueError("bad extension")   

            ddb.put_item(Item={"id": key})
            log.info("logged %s", key)
