function IdFig(pos, size) {
  var self = this;
  this.x = pos.x;
  this.y = pos.y;
  this.margin = { top: 25, right: 15, bottom: 25, left: 20 };
  this.outerWidth = size.width;
  this.outerHeight = size.height;
  this.innerWidth = size.width - this.margin.left - this.margin.right;
  this.innerHeight = size.height - this.margin.top - this.margin.bottom;

  this.fig = d3
    .select("#mainsvg")
    .append("svg")
    .attr("id", "idfig")
    .attr("x", this.x)
    .attr("y", this.y)
    .attr("width", this.outerWidth)
    .attr("height", this.outerHeight);
}
