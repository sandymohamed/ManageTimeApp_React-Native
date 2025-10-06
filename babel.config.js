// module.exports = {
//   presets: [
//     'module:metro-react-native-babel-preset',
//     '@babel/preset-typescript',         
//   ],
//   plugins: [
//     [
//       'module-resolver',
//       {
//         root: ['./src'],
//         alias: {
//           '@': './src',
//         },
//       },
//     ],
//   ],
//   overrides: [
//     {
//       test: ['./node_modules/react-native-toast-message'],
//       presets: ['module:metro-react-native-babel-preset'],
//     },
//   ],
// };


module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};