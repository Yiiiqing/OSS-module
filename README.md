# 文件上传oss模块

- client 端通过对密钥对时间戳加密, 本端通过利用密钥解密,如果解密出时间
戳在10秒内,通过验证
- 上传不论成功或者失败都会删除本地文件,为了保证硬盘无占用

### 加密方法:AES(crypto-js)
### key 在env中自定义, 需要告诉客户端人员key值

### API
1. add
    - post
    - file 文件
    - prefix 前缀(用于区分项目)
    - key 前后端共有key,用于验证

2. get
    - get
    - filename 文件名,为add接口返回的