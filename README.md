# 片刻 · 小游戏

React + TypeScript + Tailwind CSS + Phaser 3，使用 Vite 构建。

## 本地开发

```sh
pnpm install
pnpm dev
```

- 首页：`/#/`
- 打砖块：`/#/games/breakout`

## 打砖块

- 游戏页独占可用屏幕，只显示游戏、分数、关卡、生命和必要操作。适配手机安全区与动态视口高度。
- 在游戏区左右滑动控制挡板，采用相对拖动，重新落指不跳位；挡板下方留出手指操作空间。也支持鼠标或方向键 / A、D。
- 竖屏会延长游戏场地，横屏完整缩放；旋转屏幕时自动暂停。
- 点击游戏区或按空格发射小球；空格暂停 / 继续，Esc 暂停。
- 5 个关卡，3 次生命，连续击碎获得加分；通过一关恢复一颗生命，最多三颗。
- 第三关起有需要两次命中的半透明砖块。
- 第二关起加入不可破坏的灰色固定反弹板，第 2～5 关分别有 1～4 块；碰撞有独立音效，挡板不计分，也不计入通关清除目标。
- 最高分和音效偏好保存到当前浏览器，本局进度不会在刷新后恢复。
- 切换窗口自动暂停，返回后手动继续。

React 负责页面与控制面板，Phaser Arcade Physics 负责碰撞，Phaser 的粒子和 Tween 负责反馈。所有纹理由几何图形生成，音效由 Web Audio 合成，无外部图片、字体或音频请求。Phaser 在进入游戏时才加载。

## 检查与构建

```sh
pnpm test
pnpm build
pnpm preview
```

项目是纯前端静态应用，发布时只需要托管 `dist/`。Node.js 只用于开发和构建，线上无需 Node.js 服务、数据库或 API 密钥。最高分保存在本地浏览器，不会跨设备同步。

## 部署到 GitHub Pages

工作流位于 `.github/workflows/pages.yml`，使用 Node.js 22 和 `package.json` 中指定的 pnpm 版本。

首次部署：

1. 将本项目推送到 GitHub 仓库，默认分支使用 `master` 或 `main`。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 打开 **Actions → Deploy to GitHub Pages → Run workflow**，选择默认分支运行。
4. 部署成功后，在工作流的 `github-pages` 环境或 Settings → Pages 中打开网站地址。

以后推送到默认分支会自动运行测试、构建并发布。也可以手动运行工作流；非默认分支不会发布。使用 GitHub 自动提供的 `GITHUB_TOKEN`，无需另配个人令牌。

资源使用相对路径，支持 `https://用户名.github.io/仓库名/`、用户主页和自定义域名。路由使用 HashRouter，游戏地址例如 `https://用户名.github.io/仓库名/#/games/breakout`，刷新和分享该链接不会请求不存在的服务器路径，无需配置 SPA 回退或额外的 `404.html`。

首次执行前需先启用 Pages 的 GitHub Actions 来源，否则 Configure Pages 步骤可能失败。官方说明：[使用 GitHub Actions 发布 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

游戏放在 `src/games/` 下，后续可以添加独立模块和首页入口。
