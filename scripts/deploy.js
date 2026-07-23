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
const SSH_KEY = path.join(process.env.HOME || process.env.USERPROFILE, '.ssh', 'flowersink_rsa');
const DIST_DIR = path.resolve(__dirname, '..', 'dist', 'flowers-ink-v2', 'browser');

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
run(`tar czf - -C "${DIST_DIR}" . | ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "tar xzf - -C ${REMOTE_PATH} && chown -R www:www ${REMOTE_PATH}"`);
console.log('  ~ 包裹已安全抵达服务器～');

console.log('');
console.log('  🌸 ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～');
console.log('  🌸    主站部署完成！ฅ•ω•ฅ');
console.log('  🌸 ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～ ～');
console.log('');
