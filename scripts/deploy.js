const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================================
// 让 Windows 也能找到 Git Bash 里的小工具们~ ฅ•ω•ฅ
// ============================================================
const gitUsrBin = 'C:\\Program Files\\Git\\usr\\bin';
const gitBin = 'C:\\Program Files\\Git\\bin';
if (fs.existsSync(gitUsrBin)) {
  process.env.PATH = `${gitUsrBin};${gitBin};${process.env.PATH}`;
}

const REMOTE_USER = 'root';
const REMOTE_HOST = '47.109.133.108';
const REMOTE_PATH = '/www/wwwroot/FlowersInkV2/browser';
// 带 hash 的资源文件名不重名，直接增量解包会让历次构建的产物一直堆着；
// 但又不能部署时立刻删——CDN 上的 index.html 会滞后约 1 小时，那段时间
// 访客拿到的旧 HTML 还在引用旧 chunk，删早了就是白屏。所以按时间留几天再清。
const STALE_DAYS = 7;
const REMOTE_SCRIPTS_PATH = '/www/wwwroot/FlowersInkV2/scripts';
const SSH_KEY = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'flowersink_rsa');
const DIST_DIR = path.resolve(__dirname, '..', 'dist', 'flowers-ink-v2', 'browser');
// 服务器定时任务要用的脚本：sitemap / rss 每个小时在服务器上重跑一次，
// 让新文章不必等主站重新部署就能进 sitemap 和 RSS（逻辑与构建共用）
const SEO_SCRIPTS_DIR = path.resolve(__dirname);
const SEO_SCRIPT_FILES = ['seo-files.mjs', 'generate-seo-files.mjs'];

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', shell: true });
}

console.log('');
console.log('  ╭' + '─'.repeat(36) + '╮');
console.log('  │   ✨ 喵呜~ 开始编译主站 ✨       │');
console.log('  ╰' + '─'.repeat(36) + '╯');
console.log('  ~ 召唤 Angular 小精灵们集合～');
run('npm run build:prod');
console.log('  ~ 编译完成，小精灵们辛苦了！ ✔');

console.log('');
console.log('  ╭' + '─'.repeat(36) + '╮');
console.log('  │   📦 打包飞到服务器上去~           │');
console.log('  ╰' + '─'.repeat(36) + '╯');
console.log('  ~ 把代码装进小包裹，咻~ 发射！');
run(
  `tar czf - -C "${DIST_DIR}" . | ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} ` +
    `"set -e; tar xzf - -C ${REMOTE_PATH}; ` +
    `find ${REMOTE_PATH} -maxdepth 1 -name 'chunk-*.js' -mtime +${STALE_DAYS} -delete; ` +
    `find ${REMOTE_PATH} -maxdepth 1 -name 'main-*.js' -mtime +${STALE_DAYS} -delete; ` +
    `find ${REMOTE_PATH} -maxdepth 1 -name 'polyfills-*.js' -mtime +${STALE_DAYS} -delete; ` +
    `find ${REMOTE_PATH} -maxdepth 1 -name 'styles-*.css' -mtime +${STALE_DAYS} -delete; ` +
    `chown -R www:www ${REMOTE_PATH}"`
);
console.log('  ~ 包裹已安全抵达服务器～');

console.log('');
console.log('  ╭' + '─'.repeat(36) + '╮');
console.log('  │   🕒 同步定时任务用的小脚本~       │');
console.log('  ╰' + '─'.repeat(36) + '╯');
run(`tar czf - -C "${SEO_SCRIPTS_DIR}" ${SEO_SCRIPT_FILES.join(' ')} | ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_SCRIPTS_PATH} && tar xzf - -C ${REMOTE_SCRIPTS_PATH} && chown -R www:www ${REMOTE_SCRIPTS_PATH}"`);
console.log('  ~ 脚本已就位（定时任务在服务器 crontab 里）～');

console.log('');
console.log('  🌸 ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～');
console.log('  🌸    主站部署完成！ฅ•ω•ฅ');
console.log('  🌸 ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～');
console.log('');
