$("#game-size").append(
  '<option value="5">VAST</option>' +
    '<option value="6">GIGANTIC</option>' +
    '<option value="7">RIDICULOUS</option>' +
    '<option value="8">MARATHON</option>'
);

requireGW(["shared/gw_balance"], function(balance) {
  balance.numberOfSystems.push(
    108, // Vast
    144, // Gigantic
    186, // Ridiculous
    234 // Marathon
  );
  balance.galaxySizeDiffMod.push(0.95, 0.9, 0.85, 0.8);
});
