const baseUrl = "https://fantasy.espn.com/tournament-challenge-bracket/2022/en"

module.exports = {
  entryUrl: (id) => `${baseUrl}/entry?entryID=${id}`,
  groupUrl: (id) => `${baseUrl}/api/v7/group?groupID=${id}&length=50`,
  o: { sport: "ncaam", year: "2022" },
}
