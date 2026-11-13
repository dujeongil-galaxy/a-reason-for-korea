# PITFALLS

只记真实踩过、下次还会复发的坑。

## 1. 滚动淡入不要把内容默认藏起来

- **现象**：首版写 `.js .reveal { opacity: 0 }` + IntersectionObserver，长图截图里下方四个章节整片空白。
- **原因**：在无滚动、虚拟时间或 observer 回调不触发的渲染环境里，元素永远等不到 `isIntersecting`，内容就永久不可见。
- **规则**：内容默认可见；JS 只对「当前确实在首屏外」的元素加 `.pending` 做动画，另加 2.5s 定时兜底强制全部显示；`prefers-reduced-motion` 下直接全部可见。
- **验收**：必须肉眼看长图，确认四个章节都在，不能只看脚本校验全绿。

## 2. Windows 无头 Edge 的最小布局宽度不等于 `--window-size`

- **现象**：`--window-size=390,844 --screenshot` 出来的图里，副标题右侧像被裁掉，看着像移动端横向溢出。
- **真因**：CDP 实测 `innerWidth=492`（Windows 最小窗口宽度），截图却按 390 输出，右边约 100px 是**被截图裁掉**，不是页面溢出。
- **规则**：窄屏验收用 CDP `Emulation.setDeviceMetricsOverride({ width: 390, height: 844, mobile: true })`，再比 `docScrollWidth <= innerWidth`；不要只信 `--screenshot` 的边角。
- **顺带修掉的真问题**：CSS Grid 子项要 `min-width: 0` / 列用 `minmax(0, 1fr)`，长中文给 `overflow-wrap: anywhere`，避免 `1fr` 列被 min-content 撑开。

## 3. 全局 credential.helper 指向已不存在的 GCM 路径

- **现象**：`git push` 会打一行 `.../versions/1.2.0/.../git-credential-manager.exe: No such file or directory`，但推送实际成功。
- **说明**：本机 `git credential fill` 仍能非交互取到可用 token（classic `ghp_`，scope `repo, workflow`）；那行只是 helper 探测失败的噪音，不是认证失败。
- **规则**：看到这行不要误判成 push 失败，以 `git ls-remote` / push 退出码和远端分支为准。
