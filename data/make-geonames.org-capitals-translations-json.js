import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ALTNAMES = "alternateNamesV2";
const C15K = "cities15000";
const CINFO = "countryInfo";

function fetch(name, ext) {
    const local = path.join("tmp", `${name}.${ext}`);
    const remote = `https://download.geonames.org/export/dump/${name}.${ext}`;
    const outputTxt = path.join("tmp", `${name}.txt`);

    if (!fs.existsSync(local)) {
        console.log(`Downloading ${name}.${ext}`);
        execSync(`mkdir -p tmp`);
        execSync(`wget -O "${local}" "${remote}"`);
    }

    if (ext === "zip" && !fs.existsSync(outputTxt)) {
        console.log(`Unzipping ${name}.zip`);
        execSync(`unzip -o -d tmp "${local}"`);
    }
}

function processFileLines(name, processLine) {
    return new Promise((resolve, reject) => {
        const filePath = path.join("tmp", `${name}.txt`);
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            if (!line || line.startsWith('#')) return;
            const fields = line.split('\t');
            processLine(fields);
        });

        rl.on('close', () => {
            resolve();
        });

        fileStream.on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    fetch(ALTNAMES, "zip");
    fetch(C15K, "zip");
    fetch(CINFO, "txt");

    const trans = {};
    await processFileLines(ALTNAMES, (fields) => {
        if (fields[2] !== "de") return;

        const [id, name, preferred] = [fields[1], fields[3], fields[4] === "1"];

        if (!trans.hasOwnProperty(id) || preferred) {
            trans[id] = name;
        }
    });

    const [iso2to3, countryGER] = [{}, {}];
    await processFileLines(CINFO, (fields) => {

        const [iso2, iso3, id] = [fields[0], fields[1], fields[16]];

        iso2to3[iso2] = iso3;

        if (trans.hasOwnProperty(id)) {
            countryGER[iso3] = trans[id];
        }
    });

    const capitalGER = {};
    await processFileLines(C15K, (fields) => {
        if (fields[7] !== "PPLC") return;

        const [id, countryIso2] = [fields[0], fields[8]];

        if (trans.hasOwnProperty(id)) {
            const iso3 = iso2to3[countryIso2];
            if (iso3) {
                capitalGER[iso3] = trans[id];
            }
        }
    });

    // 5. Write final file (synchronous)
    const result = {
        countries: countryGER,
        capitals: capitalGER
    };

    const jsonOutput = JSON.stringify(result, null, 4);
    const outputPath = "geonames.org/ger.json";
    fs.writeFileSync(outputPath, jsonOutput, 'utf8');

    console.log(`Successfully wrote German names data to ${outputPath}`);
}

main().catch(error => {
    console.error("An error occurred during execution:", error);
});
