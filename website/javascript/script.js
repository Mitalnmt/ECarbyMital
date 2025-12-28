function showMessage(msg) {
    alert(msg);
  }
  
  document.getElementById("NutSetting").addEventListener("click", () => {
    showMessage("Bấm Cài đặt");
  });
  
  document.getElementById("NutThem").addEventListener("click", () => {
    showMessage("Bấm Thêm");
  });
  
  document.getElementById("NutChonNhieu").addEventListener("click", () => {
    showMessage("Bấm Chọn nhiều");
  });
  