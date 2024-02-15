# AIDeepIn Web

> 声明：此项目只发布于 Github，基于 MIT 协议，免费且作为开源学习使用。并且不会有任何形式的卖号等行为，谨防受骗。

![1691585544443](image/README/1691585544443.png)

![1691583184761](image/README/1691583184761.png)

![1691583124744](image/README/1691583124744.png)

![1691583329105](image/README/1691583329105.png)

此仓库为aideepin的前端，后端服务代码见[**aideepin**](https://github.com/moyangzhan/aideepin)

- [AIDeepIn Web](#aideepin-web)
  - [介绍](#介绍)
  - [前置要求](#前置要求)
    - [Node](#node)
    - [PNPM](#pnpm)
  - [安装依赖](#安装依赖)
  - [测试环境运行](#测试环境运行)
  - [环境变量](#环境变量)
  - [打包](#打包)
    - [使用 Docker](#使用-docker)

      - [Docker 参数示例](#docker-参数示例)
      - [Docker build \& Run](#docker-build--run)
    - [手动打包](#手动打包)

      - [前端网页](#前端网页-1)
  - [常见问题](#常见问题)
  - [License](#license)

## 介绍

本仓库代码基于[chatgpt-web](https://github.com/Chanzhaoyu/chatgpt-web)

接入的模型：ChatGPT 3.5，DALL-E 2

功能列表：

* 注册&登录
* 多会话（多角色）
* 图片生成（文生图、修图、图生图）
* 提示词
* 额度控制
* 自定义openai secret_key

环境变量：

全部参数变量请查看或[这里](#环境变量)

```
/service/.env.example
```

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

## 安装依赖。

根目录下运行以下命令

```shell
pnpm bootstrap
```

## 测试环境运行

根目录下运行以下命令

```shell
pnpm dev
```

## 打包

### 使用 Docker

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

### 手动打包

#### 前端网页

1、修改根目录下 `.env` 文件中的 `VITE_GLOB_API_URL` 为你的实际后端口地址

2、根目录下运行以下命令，然后将 `dist` 文件夹内的文件复制到你网站服务的根目录下

[参考信息](https://cn.vitejs.dev/guide/static-deploy.html#building-the-app)

```shell
pnpm build
```

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
