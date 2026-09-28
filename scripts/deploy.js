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
// 新版本先解到旁路目录、再整体换名就位。直接 tar 覆盖旧目录的话，历次构建的
// chunk-*.js 因为文件名带 hash 不会重名，会一直堆在服务器上清不掉
const REMOTE_NEW = `${REMOTE_PATH}.deploy-new`;
const REMOTE_OLD = `${REMOTE_PATH}.deploy-old`;
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
    `"set -e; rm -rf ${REMOTE_NEW} ${REMOTE_OLD}; mkdir -p ${REMOTE_NEW}; ` +
    `tar xzf - -C ${REMOTE_NEW}; chown -R www:www ${REMOTE_NEW}; ` +
    `mv ${REMOTE_PATH} ${REMOTE_OLD}; mv ${REMOTE_NEW} ${REMOTE_PATH}; rm -rf ${REMOTE_OLD}"`
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
