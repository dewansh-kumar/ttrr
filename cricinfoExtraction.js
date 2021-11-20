// install "minimist"
// install "axios"
// install "jsdom"
// install "excel4node"
// install "pdf-lib"

// node cricinfoExtraction.js --excel=worldCup.csv --dataFolder=data --url="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results"

let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");

let args = minimist(process.argv);

let downloadkapromise = axios.get(args.url);
downloadkapromise.then(function(response){
    let html = response.data;
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;
    let matchScoreBlock = document.querySelectorAll("div.match-score-block");
    
    let matches = [];
    for(let i =0; i < matchScoreBlock.length; i++){
      
        let match = {

        };

        let nameDetail = matchScoreBlock[i].querySelectorAll("p.name");
        match.t1 = nameDetail[0].textContent;
        match.t2 = nameDetail[1].textContent;

        let spanScore = matchScoreBlock[i].querySelectorAll("span.score");
        if(spanScore.length == 2){
           match.t1s = spanScore[0].textContent;
           match.t2s = spanScore[1].textContent;
        }else if(spanScore.length == 1){
            match.t1s = spanScore[0].textContent;
            match.t2s = "";
        }else{
            match.t1s = "";
            match.t2s = "";
        }


        let matchStatus = matchScoreBlock[i].querySelectorAll(".status-text span");
        match.result = matchStatus[0].textContent;

        matches.push(match);
    }
    
    let json = JSON.stringify(matches);
    fs.writeFileSync("worldCup.json", json, "utf-8");

    let teams = [];
     for(let i = 0; i < matches.length; i++){
        putTeaminTeamsArrIfMissing(teams, matches[i]);

     }

     for(let i = 0; i < matches.length; i++){
        putMatchInAppropriateTeam(teams, matches[i]);
     }

     creatExcelFile(teams);
     let teamsJson = JSON.stringify(teams);
     fs.writeFileSync("teams.json", teamsJson, "utf-8");

     
    if(fs.existsSync(args.dataFolder)){
        fs.rmdirSync(args.dataFolder, { recursive: true });
    }
     fs.mkdirSync(args.dataFolder);
 for(let i = 0; i < teams.length; i++){
   let teamFolder = path.join(args.dataFolder, teams[i].name);
   fs.mkdirSync(teamFolder);
   for(let j = 0; j < teams[i].matches.length; j++){
       let matchPdfFile = path.join(teamFolder, teams[i].matches[j].oppTeamName);
    
       creatPdf(teams[i].name, teams[i].matches[j], matchPdfFile);
   }
 }

})
//creat pdf
function creatPdf(teamName, match, matchPdfFile){

    let t1 = teamName;
    let t2 = match.oppTeamName;
    let t1s = match.teamScore;
    let t2s = match.oppTeamScore;
    let result = match.result;

    let originalByte = fs.readFileSync("templateFile.pdf");
    let proToLoadDoc = pdf.PDFDocument.load(originalByte);

    proToLoadDoc.then(function(pdfDoc){
        let page = pdfDoc.getPage(0);
        page.drawText(t1,{
            x : 320,
            y :670,
            size : 11,
        });

        page.drawText(t2, {
            x : 320,
            y :645,
            size : 11
        });

        page.drawText(t1s, {
            x : 320,
            y :620,
            size : 11
        });

        page.drawText(t2s, {
            x : 320,
            y :595,
            size : 11
        });

        page.drawText(result, {
            x : 320,
            y :570,
            size : 11
        });
        let proToSave = pdfDoc.save();
        proToSave.then(function(chageByte){
            // if(fs.existsSync(matchPdfFile + ".pdf")){
            //     fs.writeFileSync(matchPdfFile + "1.pdf", chageByte);
            // }else{
            // fs.writeFileSync(matchPdfFile + ".pdf", chageByte);
            // }
            let i = "";
            while(true){
                if(!fs.existsSync(matchPdfFile + i + ".pdf")){
                    fs.writeFileSync(matchPdfFile + i + ".pdf", chageByte);
                   break;
                }
                i++;
            }

        })
    })

}
// creat pdf
// excel creat
function creatExcelFile(teams){
    let wb = new excel.Workbook();

let hs = wb.createStyle({
      font : {
            color : "red",
            size : 15, 
            bold : true
      }, 
      fill : {
            type: "pattern",
            patternType: "solid",
            fgColor: "#33FF35"
      }, 
      border :{
            left: {
			style: 'thin',
			color: 'black',
		},
		right: {
			style: 'thin',
			color: 'black',
		},
		top: {
			style: 'thin',
			color: 'black',
		},
		bottom: {
			style: 'thin',
			color: 'black',
		},
      }
});

for(let i = 0; i < teams.length; i++){
      let sheet = wb.addWorksheet(teams[i].name);
      sheet.cell(1, 1).string("Vs").style(hs);
      sheet.cell(1, 2).string("Self Score").style(hs);
      sheet.cell(1, 3).string("Opp Score").style(hs);
      sheet.cell(1, 4).string("Result").style(hs);
      for(let j = 0; j < teams[i].matches.length; j++){
            sheet.cell(j + 3, 1).string(teams[i].matches[j].oppTeamName);
            sheet.cell(j + 3, 2).string(teams[i].matches[j].teamScore);
            sheet.cell(j + 3, 3).string(teams[i].matches[j].oppTeamScore);
            sheet.cell(j + 3, 4).string(teams[i].matches[j].result);
      }
}
wb.write(args.excel);
}
// excel creat

function putTeaminTeamsArrIfMissing(teams, match){
    let teamidx1  = -1;
    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == match.t1){
            teamidx1 = i;
            break;
        }
    }
    if(teamidx1 == -1){
        teams.push({
            name : match.t1,
            matches :[]
        })
    }

    let teamidx2  = -1;
    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == match.t2){
            teamidx2 = i;
            break;
        }
    }
    if(teamidx2 == -1){
        teams.push({
            name : match.t2,
            matches :[]
        })
    } 
}

function putMatchInAppropriateTeam(teams,match){
    let teamidx1  = -1;
    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == match.t1){
            teamidx1 = i;
            break;
        }
    }
    let team = teams[teamidx1];
    team.matches.push({
        oppTeamName : match.t2,
        teamScore : match.t1s,
        oppTeamScore : match.t2s,
        result : match.result
    })

    let teamidx2  = -1;
    for(let i = 0; i < teams.length; i++){
        if(teams[i].name == match.t2){
            teamidx2 = i;
            break;
        }
    }
    
     team = teams[teamidx2];
    team.matches.push({
        oppTeamName : match.t1,
        teamScore : match.t2s,
        oppTeamScore : match.t1s,
        result : match.result
    })
}

