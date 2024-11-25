import config from "./config.js";

const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');


const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');

const forecastItemsContainer = document.querySelector('.forecast-items-container');



//api key
const apiKey = config.OPEN_WEATHER_API_KEY;
searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        // console.log(cityInput.value)
        updateWeatherInfo(cityInput.value)
        cityInput.value = ''
        cityInput.blur()
    }
})
cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && cityInput.value.trim() !== '') {
        // console.log(cityInput.value)
        updateWeatherInfo(cityInput.value)

        cityInput.value = ''
        cityInput.blur()
    }
})

async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric&lang=kr`;

    const response = await fetch(apiUrl);
    return response.json();
}

function getWeatherIcon(id) {
    // console.log(id)
    if(id <= 232) return 'thunderstorm';
    if(id <= 321) return 'Drizzle';
    if(id <= 531) return 'rain';
    if(id <= 622) return 'snow';
    if(id <= 781) return 'atmosphere';
    if(id <= 800) return 'clear';
    else return 'clouds';
}

function getCurrentDate() {
    const date = new Date();
    const options = { weekday: 'short', month: 'short', day: '2-digit' };
    return date.toLocaleDateString('ko-KR', options);
}

async function updateWeatherInfo(city) {
    // ko > en으로 가는 경우 도시를 제대로 번역하지 못해 문맥을 추가하여 전달
    const context = city + "이라는 도시"
    const translatedCity = await translateCity(context, 'ko', 'en')
    console.log("ko to en : " + translatedCity)
    const weatherData= await getFetchData('weather', translatedCity);
    if (weatherData.cod !== 200) {
        showDisplaySection(notFoundSection);
        return;
    }
    // console.log(weatherData);
    showDisplaySection(weatherInfoSection);

    const {
        name: country,
        main: { temp, humidity },
        weather: [{ id, description}],
        wind: {speed}
    } = weatherData

    countryTxt.textContent = await translateCity(country, "en", "ko");
    // console.log("after translate", await translateCity(country));
    tempTxt.textContent = Math.round(temp) + '°C';
    conditionTxt.textContent = description
    humidityValueTxt.textContent = humidity + '%';
    windValueTxt.textContent = speed + 'm/s';
    weatherSummaryImg.src = `./assets/weather/${getWeatherIcon(id)}.svg`;
    currentDateTxt.textContent = getCurrentDate();

    changeBackground(id);

    await updateForecastInfo(translatedCity);
    showDisplaySection(weatherInfoSection)
}

async function updateForecastInfo(city) {
    const forecastData = await getFetchData('forecast', city);

    const timeTaken = "12:00:00";
    const todayDate = new Date().toISOString().split('T')[0];

    forecastItemsContainer.innerHTML = '';
    forecastData.list.forEach(forecastWeather => {
        if(forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate)) {
            updateForecastItems(forecastWeather);
        }
    })

}

function updateForecastItems(weatherData) {
    // console.log(weatherData)
    const {
        dt_txt: date,
        weather: [{id, main}],
        main: {temp}
    } = weatherData;

    const dateTaken = new Date(date);
    const options = {weekday: 'short'};
    const dateResult = dateTaken.toLocaleDateString('ko-KR', options);

    const forecastItem = `
            <div class="forecast-item">
                <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
                <img src="assets/weather/${getWeatherIcon(id)}.svg" alt="" class="forecast-item-img">
                <h5 class="forecast-item-temp-txt">${Math.round(temp)} ℃</h5>
            </div>
    `
    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);

}


function showDisplaySection(section) {
    [weatherInfoSection, notFoundSection, searchCitySection].forEach((s) => {
        s.style.display = 'none';
    });
    section.style.display = 'flex';
}

//translate function
async function translateCity(query, source, target) {
    const apiKey = config.GOOGLE_TRANSLATE_API_KEY; // 여기에 API 키를 삽입하세요
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: query, // 번역할 텍스트
            source: source, // 입력 언어
            target: target, // 출력 언어
        }),
    });

    const data = await response.json();
    // console.log(data);
    if (data && data.data && data.data.translations.length > 0) {
        const returnedString = data.data.translations[0].translatedText;
        return returnedString.split(" ").pop();
    }
    return "번역 실패"; // 번역 실패 시 기본 메시지
}


// getWeatherIcon()을 통해서 id를 받아온다.
// 이후 body의 background의 url을 수정하여 해당 날짜에 알맞은 이미지를 가져온다.
function changeBackground(id) {
    console.log("call changeBackground")
    const body = document.querySelector('body');
    body.style.background = `url("./assets/background/${getWeatherIcon(id)}.jpg") center / cover no-repeat`;

    // body.style.background = `url("./assets/background/thunderstorm.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/snow.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/rain.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/drizzle.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/clouds.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/atmosphere.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/clear.jpg") center / cover no-repeat`;
}
