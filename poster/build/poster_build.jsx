// ===================================================================
// 云的身体 · 海报 → Illustrator 2024 装配脚本
// 新建 800×2000mm 画板，置入成图，分「底图(锁定)」+「编辑层」两层，存 .ai
// 运行方式：Illustrator > 文件 > 脚本 > 其他脚本…  或经 COM DoJavaScriptFile
// ===================================================================
#target illustrator
(function(){
  try { app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS; } catch(e){}
  var MM = 72/25.4;                 // 1mm = 2.834645 pt
  var W = 800*MM, H = 2000*MM;      // 80×200 cm
  var DIR = "D:/Desktop/shujuxinwen/dazuoye-v2/poster/";

  var doc = app.documents.add(DocumentColorSpace.RGB, W, H);
  var ab = doc.artboards[0].artboardRect;   // [left, top, right, bottom]
  var abW = ab[2]-ab[0];
  var abH = ab[1]-ab[3];

  // ---- 底图层：置入成图并嵌入，贴合画板 ----
  var base = doc.layers[0];
  base.name = "底图(锁定)";
  var pi = base.placedItems.add();
  pi.file = new File(DIR + "yun_poster_80x200_150dpi.jpg");
  pi.position = [ab[0], ab[1]];
  try { pi.embed(); } catch(e){}
  var img = base.rasterItems.length ? base.rasterItems[base.rasterItems.length-1] : pi;
  img.width = abW; img.height = abH;
  img.left = ab[0];
  img.top  = ab[1];
  base.locked = true;

  // ---- 编辑层：留空，供手动叠加/微调 ----
  var edit = doc.layers.add();
  edit.name = "编辑层(在此叠加修改)";
  edit.hasSelectedArtwork = false;

  // ---- 存 .ai ----
  var ai = new File(DIR + "yun_poster.ai");
  var opt = new IllustratorSaveOptions();
  opt.compatibility = Compatibility.ILLUSTRATOR17;
  opt.embedICCProfile = true;
  doc.saveAs(ai, opt);

  // ---- 导出小预览 PNG 供核对 ----
  try {
    var png = new File(DIR + "export/ai_preview.png");
    var eo = new ExportOptionsPNG24();
    eo.horizontalScale = 12; eo.verticalScale = 12;
    eo.artBoardClipping = true;
    doc.exportFile(png, ExportType.PNG24, eo);
  } catch(e){}

  doc.close(SaveOptions.DONOTSAVECHANGES);
})();
