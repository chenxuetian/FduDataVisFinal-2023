function IdFig(pos, size) {
  var self = this;
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 25, right: 15, bottom: 25, left: 20 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  // 个人页面主svg
  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "idfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);

  // id选择图svg
  this.idsvg = this.fig.append("svg").attr("id", "idsvg");
  // 雷达图svg
  this.radiofig = this.fig.append("svg").attr("id", "radiofig");
  // .attr("x", ...) and so on
  // 直方图svg
  this.fig.append("svg").attr("id", "histfig").attr("id", "histfig");
  // .attr("X", ...) and so on
}

IdFig.prototype.show = function (allData) {
  // 请在这里绘制各个函数
  function renderId() {}
  function renderRadio() {}
  function renderHist() {}

  renderId();
  renderRadio();
  renderHist();
};

IdFig.prototype.updateId = function (Id) {};
