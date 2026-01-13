# 部署指南 (腾讯云/阿里云)

本项目已优化为**单端口服务**模式：后端 Node.js 服务 (Port 3001) 会自动托管 React 前端静态文件。部署时无需额外配置 Nginx 反向代理（除非需要 HTTPS 或域名映射）。

## 1. 准备工作
确保本地代码已提交或打包。
- 核心文件夹：`ui-restoration`
- 关键命令：
  - `npm run build` (构建前端)
  - `npm run server` (启动服务)

## 2. 服务器环境配置
购买云服务器 (推荐 Ubuntu 20.04/22.04 或 CentOS 7+)。
登录服务器后，执行以下命令安装 Node.js (v18+):

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

安装 PM2 (进程管理器，用于后台运行服务):
```bash
sudo npm install -g pm2
```

## 3. 代码上传
可以通过 Git 或 SCP 上传代码。

**方法 A: Git (推荐)**
1. 将代码推送到 GitHub/Gitee。
2. 在服务器上克隆：
   ```bash
   git clone <your-repo-url>
   cd newyear/ui-restoration
   ```

**方法 B: SCP/SFTP**
直接将 `ui-restoration` 文件夹上传到服务器（排除 `node_modules`）。

## 4. 安装依赖与构建
进入项目目录：
```bash
cd /path/to/ui-restoration

# 安装依赖
npm install

# 构建前端 (生成 dist 目录)
npm run build
```

## 5. 启动服务
使用 PM2 启动服务，确保断开 SSH 后服务继续运行。

```bash
# 启动服务
pm2 start server/index.js --name "newyear-energy"

# 查看状态
pm2 status

# 查看日志
pm2 logs newyear-energy
```

## 6. 防火墙设置 (关键)
在腾讯云/阿里云控制台的**安全组**设置中，放行 **3001** 端口 (TCP)。
- 如果使用 80 端口，请修改 server/index.js 中的 PORT 为 80 (需要 sudo 权限)。

## 7. 访问
- **大屏幕端**: 浏览器访问 `http://<服务器公网IP>:3001`
- **手机扫码**: 大屏幕会自动生成包含公网 IP 的二维码，直接扫描即可。

## (进阶) 使用 80 端口或域名
如果希望通过 `http://example.com` 访问：
1. **修改端口**: 将 `server/index.js` 中的 `PORT` 改为 `80`，然后重启 (`pm2 restart newyear-energy`)。注意 Linux 下使用 80 端口可能需要 root 权限。
2. **或使用 Nginx 反代**:
   ```nginx
   server {
       listen 80;
       server_name example.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```
