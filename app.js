/**
 * @author [Yiqing Zhang]
 * @email [y.zhang@live.com]
 * @create date 2020-03-06 15:06:39
 * @modify date 2020-03-06 15:06:39
 * @desc [description]
 */
const express = require("express");
const multer = require("multer");
const OSS = require("ali-oss");
var hmacSHA512 = require("crypto-js/hmac-sha512");
var Base64 = require("crypto-js/enc-base64");
var AES = require("crypto-js/aes");
var CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

var key = "fame";

var app = express();
//允许跨域 视情况而定
app.all("*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "X-Requested-With,Content-Type,X-Token"
  );
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

//存储点
let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

//创建multer对象 设置文件大小上限为512kb fileFilter 对文件进行筛选 比如文件扩展名等
let upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * process.env.filsize },
  fileFilter: function(req, file, cb) {
    cb(null, true);
  }
});
//home
app.get('/',function(req,res,next){
  res.send(`oss 上传模块
    - /add 添加,需上传file,prefix(前缀,建议为项目英文名)
    - /get 获取,需上传获取的url链接
  `)
})
//上传
app.post("/add", upload.single("file"), async function(req, res, next) {
  // 因为加入api网关,遂取消身份验证
  // let key = await decrypt(req.body.key);
  // var time = new Date().getTime().toString();
  // console.log(req.file);

  // if (!key || time - key > 100000) {
  //   //key 错误或者十秒外
  //   //删除本地文件
  //   let deleteResult = await deleteFile(req.file.path, 0);
  //   if (deleteResult) {
  //     console.log("删除本地文件成功");
  //   }else{
  //       console.log("删除本地文件失败");
  //   }
  //   return res.json({
  //     result: 1,
  //     msg: "key error"
  //   });
  // }
  console.log("上传");
  await put(req.body.prefix, req.file.filename, function(err, result) {
    if (err) {
      res.json({
        result: 1,
        msg: "Error",
        err: err
      });
      return;
    } else {
      //上传成功
      res.json({
        result: 0,
        url: result
      });
      //删除本地文件
      console.log(req.file);
      let deleteResult = deleteFile(req.file.path, 0);
      if (deleteResult) {
        console.log("删除本地文件成功");
        return;
      }
      console.log("删除本地文件失败");
    }
  });
});
//获取
app.get("/get", async function(req, res, next) {
  console.log('获取')
  // put(req.body.prefix,req.file.filename);
  await get(req.query.filename, function(err, result) {
    if (err) {
      res.json({
        result: 1,
        msg: "Error",
        err: err
      });
      return;
    } else {
      res.json({
        result: 0,
        url: result
      });
    }
  });
});
let client = new OSS({
  region: process.env.region, //阿里云对象存储地域名
  accessKeyId: process.env.accessKeyId, //api接口id
  accessKeySecret: process.env.accessKeySecret //api接口密码
});

client.useBucket(process.env.bucket); //使用的存储桶名
//向存储桶中添加文件的接口
async function put(prefix, filename, callback) {
  try {
    let result = await client.put(
      prefix + "/" + filename,
      "uploads/" + filename
    );

    callback(null, result.name);
  } catch (err) {
    callback(err);
  }
}
async function get(filename, callback) {
  try {
    let url = await client.signatureUrl(filename);
    callback(null, url);
    return url;
  } catch (err) {
    callback(err, null);
  }
}
async function decrypt(msg) {
  if (!msg) {
    return null;
  }
  var encode = CryptoJS.AES.encrypt(
    new Date().getTime().toString(),
    "fame"
  ).toString();
  console.log("encode", encode);
  var result = CryptoJS.AES.decrypt(msg, process.env.key).toString(
    CryptoJS.enc.Utf8
  );
  return result;
}

async function deleteFile(delPath, direct) {
  delPath = direct ? delPath : path.join(__dirname, delPath);
  try {
    /**
         判断文件或文件夹是否存在
        */
    if (fs.existsSync(delPath)) {
      fs.unlinkSync(delPath);
      return true;
    } else {
      console.log("inexistence path: ", delPath);
    }
  } catch (error) {
    console.log("del error", error);
    return false;
  }
}

app.listen(8888, () => {
  console.log("listen on ", 8888);
});
