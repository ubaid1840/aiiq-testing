import axios from "axios"
import moment from "moment"


export default async function getResult(url, lastDate) {
  
    let finalList = []
    let filteredTemp = []
    let startDate = moment(); 
    let endDate = moment();  
   
    if (lastDate) {
        const last = moment(lastDate); 
        endDate = last.subtract(1, 'days'); 
        startDate = endDate.clone().subtract(2, 'days'); 
    } else {
        startDate.subtract(2, 'days'); 
    }

    if(moment(new Date(endDate)).isAfter("2024-07-01")){
        while (filteredTemp.length <= 10 && moment(new Date(endDate)).isAfter("2024-07-01")) {
            await axios.post(`${url}/sessions/filter`, {
                start_date: moment(new Date(startDate)).format("YYYY-MM-DD") + "T00:00:00",
                end_date: moment(new Date(endDate)).format("YYYY-MM-DD") + "T23:59:59",
            }).then((response) => {
                finalList = [...response.data, ...finalList]
                filteredTemp = [...finalList.filter((item) => item.headline)];
                endDate = startDate.clone().subtract(1, 'days');
                startDate = endDate.clone().subtract(2, 'days');
            })
        }
    }
    startDate = startDate.clone().add(2, 'days')
    return ({ data: filteredTemp, lastDate: startDate.format("YYYY-MM-DD") })
}