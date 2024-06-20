# AIDeepIn Web

**LangChain4j-AIDeepin**
基于 ChatGPT 等大语言模型与 Langchain4j 等应用框架实现，开源、可离线部署的检索增强生成(RAG)项目。

> **该项目如对您有帮助，欢迎点赞**

代码仓库地址： [github](https://github.com/moyangzhan/langchain4j-aideepin-web)   [gitee](https://gitee.com/moyangzhan/langchain4j-aideepin-web)

## 介绍

本仓库为langchain4j-aideepin的前端项目

后端服务： [langchain4j-aideepin](https://github.com/moyangzhan/langchain4j-aideepin)
管理端WEB：[langchain4j-aideepin-admin](https://github.com/moyangzhan/langchain4j-aideepin-admin)

## 功能点

* 注册&登录
* 多会话（多角色）
* 图片生成（文生图、修图、图生图）
* 提示词
* 额度控制
* 基于大模型的知识库（RAG）
* 基于大模型的搜索（RAG）
* 多模型随意切换
* 多搜索引擎随意切换

## 接入的模型：

* ChatGPT 3.5
* 通义千问
* 文心一言
* ollama
* DALL-E 2

## 前置要求

### Node

`node` 需要 `^16 || ^18 || ^19` 版本（`node >= 14` 需要安装 [fetch polyfill](https://github.com/developit/unfetch#usage-as-a-polyfill)），使用 [nvm](https://github.com/nvm-sh/nvm) 可管理本地多个 `node` 版本

```shell
node -v
```

### PNPM

如果你没有安装过 `pnpm`

```shell
npm install pnpm -g
```

## 安装依赖

根目录下运行以下命令

```shell
pnpm bootstrap
```

## 本地环境开发

1、修改根目录下 `.env` 文件中的 `VITE_GLOB_API_URL` 为你的实际后端口地址

2、根目录下运行以下命令

```shell
pnpm dev
```

3、如后端服务为远程地址，使用nginx解决跨域问题

nginx配置参考 [./docker-compose/nginx/nginx.conf](docker-compose/nginx/nginx.conf)

## 正式环境

### 发布方式1 - 使用 Docker

#### Docker build & Run

```bash
docker build -t aideepin-web .

# 前台运行
docker run --name aideepin-web --rm -it -p 127.0.0.1:1002:1002 aideepin-web

# 后台运行
docker run --name aideepin-web -d -p 127.0.0.1:1002:1002 aideepin-web

# 运行地址
http://localhost:1002/
```

### 发布方式2 - 手动打包

1、 nginx配置

服务器上nginx的配置可以参考 `./docker-compose/nginx/nginx.conf`，将 `proxy_pass http://localhost:9999/;` 中的 `localhost:9999`改成后端服务对应的ip及端口

**如果管理端WEB跟用户端WEB使用同一个nginx**，可参考以下配置：

```shell
# adi-web存放的是用户端构建后的代码
# adi-admin-web存放的是管理端构建后的代码

# 用户端WEB页面配置
# 访问地址：http://你的ip:port/
location / {
  root /usr/share/nginx/adi-web;
  try_files $uri /index.html;
}

# 管理端WEB页面配置
# 访问地址：http://你的ip:port/admin
  location /admin/ {
    alias /usr/share/nginx/adi-admin-web/;
   	index /index.html;
  }

# 后端服务
location /api/ {
  proxy_set_header X-Real-IP $remote_addr; #转发用户IP
  proxy_pass http://localhost:9999/;
}
```

2、根目录下运行以下命令，[参考信息](https://cn.vitejs.dev/guide/static-deploy.html#building-the-app)

```shell
pnpm build
```

3、将 `dist` 文件夹内的文件复制到网站服务的根目录下

网站服务的根目录：`nginx.conf` 的 `location /` 设置的目录

## 常见问题

Q: 为什么 `Git` 提交总是报错？

A: 因为有提交信息验证，请遵循 [Commit 指南](./CONTRIBUTING.md)

Q: 如果只使用前端页面，在哪里改请求接口？

A: 根目录下 `.env` 文件中的 `VITE_GLOB_API_URL` 字段。

Q: 文件保存时全部爆红?

A: `vscode` 请安装项目推荐插件，或手动安装 `Eslint` 插件。

Q: 前端没有打字机效果？

A: 一种可能原因是经过 Nginx 反向代理，开启了 buffer，则 Nginx 会尝试从后端缓冲一定大小的数据再发送给浏览器。请尝试在反代参数后添加 `proxy_buffering off;`，然后重载 Nginx。其他 web server 配置同理。

## License

MIT

## 截图

![1691585544443](image/README/1691585544443.png)

AI聊天：
![1691583184761](image/README/1691583184761.png)

AI绘图：
![1691583124744](image/README/1691583124744.png)

知识库：
![1691583329105](image/README/kbidx.png)
![1691583329105](image/README/kb01.png)
![1691583329105](image/README/kb02.png)
![1691583329105](image/README/kb03.png)

token统计：
![1691583329105](image/README/1691583329105.png)
