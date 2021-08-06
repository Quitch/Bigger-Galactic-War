var biggerGalacticWarLoaded;

if (!biggerGalacticWarLoaded) {
  biggerGalacticWarLoaded = true;

  try {
    _.defer(function () {
      model.galaxy.zoom(Math.max(model.galaxy.zoom(), model.galaxy.minZoom()));
    });
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
