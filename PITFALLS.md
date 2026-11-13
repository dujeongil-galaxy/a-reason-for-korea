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

## 4. 生成页替换相对路径时，替换串不能补闭合引号

- **现象**：生成脚本写 `out.replace(/\b(href|src)="(assets\/|favicon\.svg)/g, '$1="../$2"')`，结果生成页里变成 `href="../assets/"styles.css"`——多出一个引号，CSS 直接失效。
- **原因**：正则只吃掉 `href="assets/` 这一段，原字符串剩下的 `styles.css"` 还在；替换串里又补了闭合引号，于是引号多了一个。
- **规则**：这类「只加前缀」的替换，替换串结尾**不要带引号**：`'$1="../$2'`。
- **为什么能立刻抓到**：`verify-i18n.mjs` 的资源检查要求生成页出现 `../assets/styles.css` 等四个精确路径，第一次跑就判红。

## 5. 截图缩放会把小字「压没」，不要凭它判断元素重叠

- **现象**：加语言切换器后，四语首屏截图里右上角的「Source ↗」看起来只剩 `urce ↗`，像被切换器盖住。
- **真因**：1440px 截图被缩小展示，小字笔画糊掉了；CDP 实测切换器与源码按钮间距 20px（`overlap = -20`），`scrollWidth == clientWidth`，没有任何重叠或压缩。
- **规则**：判断重叠、裁切、溢出一律用 `getBoundingClientRect()` 与 `scrollWidth / clientWidth` 的数值，截图只用来看整体观感和字体缺字。

## 6. 多语言站点：中文只留一份，靠校验防漂移

- **现象**：四语页面最容易出现的维护事故，是中文源文案和字典里的中文副本不一致，或某个语言漏翻一个 key，页面悄悄退回中文。
- **规则**：`index.html` 是唯一中文源；`assets/i18n.js` 只存 en/ja/ko 译文与四语的属性 / JS 文案；生成页由脚本产出、不手改。
- **强制层**：`scripts/verify-i18n.mjs` 逐字比对 69 个译文节点、10 个属性、四语 key 集合、中文关键串是否还在、资源路径与切换器状态，并内置 7 项故意造错的自检（漏 key / 中文残留 / 错 lang / 路径未加前缀 / 中文被删 / 属性漂移 / 高亮错误），必须 7/7 判红才算通过。
