# web

# .babelrc 파일이 꼭 필요함.
이 파일은 gulp가 gulpfile.bable.js를 파싱하기 위해 설정 값을 가지고 있음.

내용은
{
  "presets": ["es2015"]
}

# gulp는 3.9.0을 사용.
For some reason gulp v3.9.1~4.0 has this issue but when using 3.9.0 i have no issue what so ever.

npm install --save-dev gulp@3.9.0

참고 : https://foundation.zurb.com/forum/posts/54969-failed-to-load-external-module-babelregister
