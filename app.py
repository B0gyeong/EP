from flask import Flask, request, jsonify
from flask_cors import CORS
from openai
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)  # Flask app 생성
CORS(app)

openai.api_key = os.environ["OPENAI_API_KEY"]

@app.route("/generate", methods=["POST"])     # '/generate' 경로로 들어오는 POST 처리
def generate():
    user_question = request.json["prompt"]     # 클라이언트로 받은 JSON에서 'prompt' 추출

    system_msg = "당신은 사용자의 질문에 더 정확하고 개인화된 답변을 제공하는 데 도움을 주는 질문 설계 전문가입니다."

    prompt = f"""
1. 사용자의 질문에 대해, **답변 관점이나 언어 수준 등의 차이를 명확히 보여줄 수 있는 역할(Role)**을 3개 제안해주세요.
- 각 역할은 짧고 직관적인 이름(예: 국어 교사, 역사 큐레이터)으로 제시해주세요.
- 각 역할이 어떤 관점에서 답하는지를 부가 설명(괄호 등)으로 간단히 덧붙여주세요.
- 추가적인 사용자 정보 없이도 답변이 가능해야 합니다.
(예: “사용자 성향에 따라 맞춤 추천”과 같은 조건부 역할은 제외해주세요.)

2. 다음 사용자 질문에 대해, 답변의 정확성과 만족도를 높이기 위해 함께 제공하면 좋은 세부 옵션 항목 5개를 제안해주세요.
- 각 항목은 “이런 정보가 포함되면 더 나은 답변이 생성 된다”는 관점에서 작성해주세요.
- 각 항목은 사용자의 입장에서 생성되어야 하고, 사용자의 질문에 직접 포함될 수 있는 문장 형태로 제시해주세요.
- 사용자의 취향, 선호, 배경 정보가 필요한 항목(예: 추천받고 싶은 키워드, 연령대, 최근에 읽은 책 등)은 포함하지 마세요.
- 내용, 구성, 정보의 범위 등 다양한 측면을 고려해주세요.
- 설명 없이 리스트 형식으로 출력해주세요.

---

다음은 질문과 출력 예시입니다. 이 형식을 참고해서 출력해주세요:

사용자 질문 예시: "오사카 2박 3일 여행 코스 추천해줘"

출력 예시:  
[역할]  
- 초등학생 선생님 (쉽고 재미있게 설명하는 관점)  
- 여행 가이드 (동선과 명소 중심의 전문 추천)  
- 대학생 친구 (가성비와 젊은 감성 중심 추천)  

[세부 옵션 항목]  
- 주요 관광지 방문 포함해줘  
- 현지 음식점 및 추천 메뉴 포함해줘  
- 쇼핑 명소 소개를 포함해줘  
- 체험 활동을 포함해줘  
- 이동 동선 고려한 효율적 경로를 제안해줘

---

이제 다음 사용자 질문에 대해 위와 같은 형식으로 출력해주세요:

사용자 질문: "{user_question}"
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ]
    )

    result = response["choices"][0]["message"]["content"]
    return jsonify({"result": result})
    
@app.route("/regenerate", methods=["POST"])
def regenerate():
    user_question = request.json["prompt"]
    previous_options = request.json.get("previous_options", [])

    # 이전 옵션 텍스트 구성
    previous_option_text = "\n".join(f"- {opt}" for opt in previous_options)

    system_msg = "당신은 사용자의 질문에 더 정확하고 개인화된 답변을 제공하는 데 도움을 주는 질문 설계 전문가입니다."

    prompt = f"""
다음 사용자 질문에 대해, 답변의 정확성과 만족도를 높이기 위해 함께 제공하면 좋은 세부 옵션 항목 5개를 제안해주세요.
- 각 항목은 “이런 정보가 포함되면 더 나은 답변이 생성 된다”는 관점에서 작성해주세요.
- 각 항목은 사용자의 입장에서 생성되어야 하고, 사용자의 질문에 직접 포함될 수 있는 문장 형태로 제시해주세요.
- 사용자의 취향, 선호, 배경 정보가 필요한 항목(예: 추천받고 싶은 키워드, 연령대, 최근에 읽은 책 등)은 포함하지 마세요.
- 다양한 측면(내용, 구성, 정보의 범위 등)을 고려해 작성해주세요.
- 이전에 사용한 옵션과는 겹치지 않도록 해주세요.
---
[이전 옵션]
{previous_option_text}

---
아래는 질문과 출력 예시입니다:

사용자 질문 예시: "오사카 2박 3일 여행 코스 추천해줘"

출력 예시: 
[세부 옵션 항목]  
- 주요 관광지 방문 포함해줘  
- 현지 음식점 및 추천 메뉴 포함해줘  
- 쇼핑 명소 소개를 포함해줘  
- 체험 활동을 포함해줘  
- 이동 동선 고려한 효율적 경로를 제안해줘

---
이제 다음 사용자 질문에 대해 위와 같은 형식으로 출력해주세요:

사용자 질문: "{user_question}"
"""

    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": prompt}
        ]
    )

    result = response["choices"][0]["message"]["content"]
    return jsonify({"result": result})


if __name__ == "__main__":
    app.run(debug=True)

