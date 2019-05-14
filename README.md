#### 参照
* 先登录 (admin/123qwe)
[http://refdemo.app.yyuap.com/wbalone/pages/login/login.html?r=L3diYWxvbmUv](http://refdemo.app.yyuap.com/wbalone/pages/login/login.html?r=L3diYWxvbmUv)

* 再访问
[http://refdemo.app.yyuap.com/dist/ucf-publish/iuap-pap-demo-fe/ref-demo/index.html](http://refdemo.app.yyuap.com/dist/ucf-publish/iuap-pap-demo-fe/ref-demo/index.html)

#### 门户
* [某一wbalone项目](https://gitee.com/liushaozhen/sany-wbalone/) 
* [改造后轻量级门户项目](https://github.com/ranyanchuan/reac_ap_fe)

#### 流程
* 安装最新流程包 `npm install yyuap-bpm@0.3.38 `
* 安装最新表格参照 `npm install ref-multiple-table@2.0.2`
* 添加项目级 BPM `banklaon_react/src/components/Bpm/BpmButtonSubmit.js` 和 `banklaon_react/src/components/Bpm/common.js` (源代码在工程中)
* 在 `banklaon_react/src/pages/xml_sale_order/components/SaleOrder-edit/edit.js`中引入项目级 BPM
```bash
import {BpmTaskApprovalWrap} from 'yyuap-bpm'; // 只引入 BpmTaskApprovalWrap，去掉之前引入的  BpmButtonSubmit
import BpmButtonSubmit from "components/Bpm/BpmButtonSubmit";  //项目级 BPM

```

#### 查询分页
+ 
