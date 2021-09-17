import { useCallback, useState } from "react";
import styled from "styled-components"

import ReactFileReader from 'react-file-reader';
import moment from "moment"
import XLSX from 'xlsx';

const App = () => {
  // json to excel
  const [selectedFiles, setSelectedFiles] = useState([])
  const [excelData, setExcelData] = useState({})

  // excel to json -> txt
  const [jsonData, setJsonData] = useState({})

  const [loading, setLoading] = useState(false)

  // 가져온 JSON 파일 데이터 핸들러
  const handleJSONFiles = useCallback(files => {
    const reader = new FileReader();

    reader.onload = (e)  => {
      let tempExcelData = Object.assign({}, excelData)
      const data = JSON.parse(reader.result)
      tempExcelData[files[0].name] = data

      setExcelData(tempExcelData)
    }

    if(selectedFiles.indexOf(files[0].name) === -1) {
      setSelectedFiles([...selectedFiles, files[0].name])
    }
    reader.readAsText(files[0]);
  }, [excelData, selectedFiles])


  // JSON 데이터 엑셀형식으로 변환하여 다운로드하기
  const downloadxls = useCallback(async () => {
    await setLoading(true)
    const excelList = []
    const ExcelObjectKey = Object.keys(excelData)
  
    Object.keys(excelData[ExcelObjectKey[0]]).forEach((el, index) => {
      const matchingData = {}

      matchingData["번역어"] = el
      ExcelObjectKey.forEach((lan) => {
        matchingData[lan] = excelData[lan][el] ? excelData[lan][el] : ""
      })
      excelList.push(matchingData)
    })

    const ws = XLSX.utils.json_to_sheet(excelList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "sheet");
    XLSX.writeFile(wb, `${moment().format("YYYY-MM-DD")}_languageDB.xlsx`);

    await setLoading(false)
  }, [excelData])

  // 가져온 엑셀 파일 데이터 핸들러
  const handleXLXSFiles = useCallback(files => {
    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString;

    reader.onload = (e)  => {
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: rABS ? 'binary' : 'array', bookVBA : true });
      /* Get first worksheet */
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      /* Convert array of arrays */
      const data = XLSX.utils.sheet_to_json(ws);
      
      /* Update state */
      const allJson = {}
      const zhChtjson = {}
      const thjson = {}
      const arXAjson = {}
      const frjson = {}
      for(const textItem of data) {
        if(textItem.__EMPTY_1 === "번역어") {
          continue;
        }

        const transLan = textItem.__EMPTY_1.replace( /\r\n/gi, '\n')

        zhChtjson[transLan] = textItem.__EMPTY_5 ? textItem.__EMPTY_5.replace( /\r\n/gi, '\n') : ""
        thjson[transLan] = textItem.__EMPTY_6 ? textItem.__EMPTY_6.replace( /\r\n/gi, '\n') : ""
        arXAjson[transLan] = textItem.__EMPTY_7 ? textItem.__EMPTY_7.replace( /\r\n/gi, '\n') : ""
        frjson[transLan] = textItem.__EMPTY_8 ? textItem.__EMPTY_8.replace( /\r\n/gi, '\n') : ""
      }

      allJson["zhcht"] = zhChtjson
      allJson["th"] = thjson
      allJson["arXA"] = arXAjson
      allJson["fr"] = frjson

      setJsonData(allJson)
    }

    if (rABS) {
      reader.readAsBinaryString(files[0]);
    } else {
      reader.readAsArrayBuffer(files[0]);
    };
  }, [])

  // 뽑아낸 json txt로 변환
  const downloadTxtFile = useCallback(async () => {
    await setLoading(true)

    Object.keys(jsonData).forEach(el => {
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(jsonData[el])],    
                  {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = `${moment().format("YYYY-MM-DD")}${el}.txt`;
      document.body.appendChild(element);
      element.click();
    })

    await setLoading(false)
  }, [jsonData])

  return (
    <Container className={"app"}>
      <CenterDiv>
        <ReactFileReader fileTypes={[".json"]} handleFiles={handleJSONFiles}>
          <TextButton>
            JSON File upload (convert excel)
          </TextButton>
        </ReactFileReader>
        <RowView>
          {selectedFiles.length > 0 && selectedFiles.map((item, index) => {
            return (
              <TextButton key={index} onClick={() => {
                let tempFiles = [...selectedFiles]
                let tempExcelData = Object.assign({}, excelData)

                const searchIndex = tempFiles.indexOf(item)

                if(searchIndex !== -1) {
                  tempFiles.splice(searchIndex, 1)
                  delete tempExcelData[item]

                  setExcelData(tempExcelData)
                  setSelectedFiles(tempFiles)
                }
              }}>
                {item}
              </TextButton>
            )
          })}
        </RowView>
        {Object.keys(excelData).length > 0 && <TextButton disabled={loading} style={{marginTop: "15px"}} onClick={downloadxls}>{loading ? "Excel DownLoading" : "Excel Download"}</TextButton>}
      </CenterDiv>

      <CenterDiv>
        <ReactFileReader fileTypes={[".xlsx"]} handleFiles={handleXLXSFiles}>
          <TextButton>
            Excel File upload (convert JSON)
          </TextButton>
        </ReactFileReader>
        <RowView>
          {Object.keys(jsonData).length > 0 && Object.keys(jsonData).map((item, index) => {
            return (
              <TextButton key={index} onClick={() => {
                let tempJson = Object.assign({}, jsonData)

                delete tempJson[item]
                setJsonData(tempJson)
              }}>
                {item}.json
              </TextButton>
            )
          })}
        </RowView>
        {Object.keys(jsonData).length > 0 && <TextButton disabled={loading} style={{marginTop: "15px"}} onClick={downloadTxtFile}>{loading ? "above json parsing text DownLoading" : "above json parsing text Download"}</TextButton>}
      </CenterDiv>
    </Container>
  );
}

export default App;

const CenterDiv = styled.div`
  display: flex;
  flex-direction: column;

  justify-content:center;
  align-items:center;

  margin-bottom: 20px;
`;

const Container = styled(CenterDiv)`
  flex: 1;

  display: flex;
`;

const RowView = styled.div`
  display: flex;
  align-items: center;

  margin-top: 5px;
`;

const TextButton = styled.button`
  margin: 0px 5px;
  padding: 0;

  width: 120px;
  height: 50px;

  borderRadius: 10px;

`


