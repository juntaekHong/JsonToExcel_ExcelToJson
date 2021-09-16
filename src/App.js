import { useCallback, useState } from "react";
import styled from "styled-components"

import ReactFileReader from 'react-file-reader';
import moment from "moment"
import XLSX from 'xlsx';

const App = () => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [excelData, setExcelData] = useState({})

  const [loading, setLoading] = useState(false)

  const handleFiles = useCallback(files => {
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

  return (
    <Container className={"app"}>
      <CenterDiv>
        <ReactFileReader fileTypes={[".json"]} handleFiles={handleFiles}>
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
    </Container>
  );
}

export default App;

const CenterDiv = styled.div`
  display: flex;
  flex-direction: column;

  justify-content:center;
  align-items:center;
`;

const Container = styled(CenterDiv)`
  flex: 1;

  display: flex;
`;

const RowView = styled.div`
  display: flex;
  align-items: center;
`;

const TextButton = styled.button`
  margin: 0;
  padding: 0;

  width: 150px;
  height: 50px;

  borderRadius: 10px;
`


