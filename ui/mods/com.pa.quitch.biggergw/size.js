var biggerGalacticWarLoaded;

if (!biggerGalacticWarLoaded) {
  biggerGalacticWarLoaded = true;

  function biggerGalacticWarSize() {
    try {
      $("#game-size").append(
        '<option value="5">VAST</option>' +
          '<option value="6">GIGANTIC</option>' +
          '<option value="7">RIDICULOUS</option>' +
          '<option value="8">MARATHON</option>'
      );
      locTree($("#game-size"));

      requireGW(["shared/gw_balance"], function (balance) {
        balance.numberOfSystems.push(
          108, // Vast
          144, // Gigantic
          186, // Ridiculous
          234 // Marathon
        );
        balance.galaxySizeDiffMod.push(0.95, 0.9, 0.85, 0.8);
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  biggerGalacticWarSize();
}
