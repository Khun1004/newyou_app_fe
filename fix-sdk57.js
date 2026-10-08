// SDK 57 업그레이드용 자동 수정 스크립트
// 사용법: 프로젝트 폴더(D:\newyou_app_fe)에 이 파일을 두고  node fix-sdk57.js  실행
const fs = require("fs");
const path = require("path");

const replacements = [
  [/(['"])@react-navigation\/native\1/g, "'expo-router/react-navigation'"],
  [/(['"])@react-navigation\/elements\1/g, "'expo-router/react-navigation'"],
  [/(['"])@react-navigation\/bottom-tabs\1/g, "'expo-router/js-tabs'"],
  [
    /import Icon from ['"]react-native-vector-icons\/Ionicons['"];?/g,
    "import { Ionicons as Icon } from '@expo/vector-icons';",
  ],
  [/StyleSheet\.absoluteFillObject/g, "StyleSheet.absoluteFill"],
];

const changed = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (/\.(tsx?|jsx?)$/.test(name)) {
      const before = fs.readFileSync(full, "utf8");
      let after = before;
      for (const [from, to] of replacements) after = after.replace(from, to);
      if (after !== before) {
        fs.writeFileSync(full, after, "utf8");
        changed.push(path.relative(process.cwd(), full));
      }
    }
  }
}

for (const dir of ["app", "components", "hooks"]) {
  if (fs.existsSync(dir)) walk(dir);
}

if (changed.length === 0) {
  console.log("바꿀 곳이 없습니다. (이미 모두 수정되어 있어요)");
} else {
  console.log(`✅ ${changed.length}개 파일을 수정했습니다:`);
  for (const f of changed) console.log("  - " + f);
}
