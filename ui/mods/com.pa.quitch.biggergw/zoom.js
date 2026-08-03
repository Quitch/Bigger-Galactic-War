try {
  _.defer(function () {
    model.galaxy.zoom(Math.max(model.galaxy.zoom(), model.galaxy.minZoom()));
    model.centerOnPlayer();
  });
} catch (e) {
  console.error(e);
  console.error("Bigger Galactic War: " + (e.stack || e.message || e));
}
