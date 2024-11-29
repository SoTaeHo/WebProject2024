import config from "./config.js";

const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const requestBtn = document.querySelector('.request-btn');
const backBtn = document.querySelector('.back-btn');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');
const recommendationTxt = document.querySelector('.recommendation-txt');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const mentionSection = document.querySelector('.mention');

const forecastItemsContainer = document.querySelector('.forecast-items-container');


//api key
const apiKey = config.OPEN_WEATHER_API_KEY;

const OpenAIApiKey = config.OPENAI_API_KEY;

let isAnalyzed = false;

searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() !== '') {
        isAnalyzed = false;
        // console.log(cityInput.value)
        updateWeatherInfo(cityInput.value)
        cityInput.value = ''
        cityInput.blur()
    }
})
cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && cityInput.value.trim() !== '') {
        isAnalyzed = false;
        // console.log(cityInput.value)
        updateWeatherInfo(cityInput.value)

        cityInput.value = ''
        cityInput.blur()
    }
})

requestBtn.addEventListener('click', async () => {
    if (isAnalyzed) {
        showDisplaySection(mentionSection);
        return;
    }
    // 버튼 비활성화 및 "분석중..." 표시
    requestBtn.disabled = true;
    const originalText = requestBtn.textContent; // 원래 버튼 텍스트 저장
    requestBtn.textContent = "분석중...";

    cityInput.disabled = true;
    searchBtn.disabled = true;

    const weatherData = {
        temp: tempTxt.textContent,
        description: conditionTxt.textContent,
        wind: windValueTxt.textContent,
        humidity: humidityValueTxt.textContent
    };

    try {
        // OpenAI API로부터 추천 멘트 가져오기
        const recommendation = await getWeatherRecommendations(weatherData);
        isAnalyzed = true;
        showDisplaySection(mentionSection);
        typeTextBySentence(recommendationTxt, recommendation, 20);
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        recommendationTxt.textContent = "추천을 생성하는 데 실패했습니다.";
    } finally {
        // 버튼 활성화 및 원래 텍스트 복원
        requestBtn.disabled = false;
        requestBtn.textContent = originalText;
        cityInput.disabled = false;
        searchBtn.disabled = false;
    }})

backBtn.addEventListener('click', () => {

    showDisplaySection(weatherInfoSection);

});

async function getFetchData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric&lang=kr`;

    const response = await fetch(apiUrl);
    return response.json();
}

function getWeatherIcon(id) {
    // console.log(id)
    if (id <= 232) return 'thunderstorm';
    if (id <= 321) return 'Drizzle';
    if (id <= 531) return 'rain';
    if (id <= 622) return 'snow';
    if (id <= 781) return 'atmosphere';
    if (id <= 800) return 'clear';
    else return 'clouds';
}

function getCurrentDate() {
    const date = new Date();
    const options = {weekday: 'short', month: 'short', day: '2-digit'};
    return date.toLocaleDateString('ko-KR', options);
}

async function updateWeatherInfo(city) {
    // ko > en으로 가는 경우 도시를 제대로 번역하지 못해 문맥을 추가하여 전달
    const context = city + "이라는 도시"
    const translatedCity = await translateCity(context, 'ko', 'en')
    console.log("ko to en : " + translatedCity)
    const weatherData = await getFetchData('weather', translatedCity);
    if (weatherData.cod !== 200) {
        showDisplaySection(notFoundSection);
        return;
    }
    // console.log(weatherData);

    const {
        name: country,
        main: {temp, humidity},
        weather: [{id, description}],
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

    showDisplaySection(weatherInfoSection);
}

async function updateForecastInfo(city) {
    const forecastData = await getFetchData('forecast', city);

    const timeTaken = "12:00:00";
    const todayDate = new Date().toISOString().split('T')[0];

    forecastItemsContainer.innerHTML = '';
    forecastData.list.forEach(forecastWeather => {
        if (forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate)) {
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
    [weatherInfoSection, notFoundSection, searchCitySection, mentionSection].forEach((s) => {
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
    body.style.background = `url("./assets/background/${getWeatherIcon(id)}.jpg") no-repeat`;
    body.style.backgroundSize = "150% 150%"; // 이미지 확대
    body.style.backgroundPosition = "0% 50%"; // 초기 위치 설정
    body.style.animation = "moveBackground 120s linear infinite"; // 애니메이션 설정
    // body.style.background = `url("./assets/background/thunderstorm.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/snow.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/rain.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/drizzle.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/clouds.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/atmosphere.jpg") center / cover no-repeat`;
    // body.style.background = `url("./assets/background/clear.jpg") center / cover no-repeat`;
}

// 날씨 데이터를 입력받아 OpenAI API로 추천 멘트를 생성하는 함수
async function getWeatherRecommendations(weatherData) {
    const prompt = generatePrompt(weatherData);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OpenAIApiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4", // 사용할 모델 (올바른 이름 사용)
                messages: [
                    {
                        role: "system", // 시스템 메시지: 모델의 행동 지침
                        content: "당신은 날씨 전문가로, 사용자의 날씨 데이터를 기반으로 추천 복장과 외출 팁을 제공합니다."
                    },
                    {
                        role: "user", // 사용자 입력
                        content: prompt // 사용자가 제공한 프롬프트
                    }
                ],
                temperature: 0.7 // 창의성 조정
            })
        });
        console.log(response);
        const result = await response.json(); // 응답 본문(JSON)으로 읽기
        console.log("Parsed Response JSON:", result); // 파싱된 JSON 출력
        return result.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error fetching OpenAI API:", error);
        return "추천을 생성하는 데 문제가 발생했습니다.";
    }
}


// 날씨 데이터를 기반으로 프롬프트 생성
function generatePrompt(weatherData) {
    return `
        현재 날씨 데이터를 기반으로 복장, 추천 물품, 그리고 오늘 외출 시 유용한 조언을 제안해줘.
        날씨 데이터:
        - 현재 온도: ${weatherData.temp}°C
        - 날씨 상태: ${weatherData.description} (예: 맑음, 비, 눈, 흐림, 폭우 등)
        - 풍속: ${weatherData.wind} m/s
        - 습도: ${weatherData.humidity}%

        아래를 참고하여 간결하고 실용적인 추천을 작성해줘:
        1. 복장: 현재 날씨와 체감 온도를 기준으로 적합한 옷차림을 추천해줘. 예를 들어, 비가 오면 방수 재킷과 장화를 추천하거나, 추운 날에는 두꺼운 코트와 장갑을 추천.
        2. 물품: 날씨 상태에 따라 외출 시 반드시 챙겨야 할 물품을 제안해줘. 예를 들어, 맑은 날에는 선글라스, 비 오는 날에는 우산, 눈이 오는 날에는 방수 신발을 제안.
        3. 유용한 팁: 현재 날씨 조건에서 외출 시 알아두면 좋은 정보를 포함해줘. 예를 들어, 강한 바람이 불 경우 모자 착용을 피하라는 조언.

        예제:
        - 날씨가 맑고 온도가 25°C일 경우: "반소매 티셔츠와 가벼운 바지를 추천합니다. 선글라스와 자외선 차단제를 꼭 챙기세요. 외출 시 물을 충분히 마셔 더위를 예방하세요."
        - 비가 오고 온도가 12°C일 경우: "방수 재킷과 장화를 추천합니다. 우산을 챙기고, 젖지 않도록 소지품을 방수 가방에 보관하세요."

        현재 데이터를 기반으로 맞춤형 추천을 작성해줘. 글자 수는 200자를 넘지 않는 선에서 추천해줘.
        그리고 답변의 시작과 긑에 큰따옴표나 작은 따옴표는 빼고 텍스트를 반환해줘.
    `;
}

// 타이핑 애니메이션 함수
function typeTextBySentence(element, text, speed = 50) {
    element.textContent = ""; // 기존 텍스트 초기화
    const sentences = text.split(/(?<=[.!?])\s+/); // 문장을 분리 (정규식 사용)
    let sentenceIndex = 0; // 현재 문장의 인덱스

    // 현재 문장의 타이핑
    function typeSentence() {
        const sentence = sentences[sentenceIndex]; // 현재 문장 가져오기
        let charIndex = 0; // 현재 문장의 글자 인덱스
        const interval = setInterval(() => {
            element.textContent += sentence[charIndex]; // 1글자씩 추가
            charIndex++;
            if (charIndex === sentence.length) {
                clearInterval(interval); // 문장 타이핑 완료
                sentenceIndex++;
                if (sentenceIndex < sentences.length) {
                    element.textContent += "\n"; // 문장 끝나면 줄바꿈 추가
                    typeSentence(); // 다음 문장 타이핑
                }
            }
        }, speed);
    }

    typeSentence(); // 첫 문장 타이핑 시작
}
