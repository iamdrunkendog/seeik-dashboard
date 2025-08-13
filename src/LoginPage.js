import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import axios from 'axios'; // axios 임포트
import md5 from 'js-md5'; // md5 임포트

function LoginPage({ onLoginSuccess }) {
  const [id, setId] = useState(''); // ID 상태 추가
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 경고: 이 URL은 실제 Lambda + API Gateway 엔드포인트로 변경해야 합니다.
  const AUTH_API_URL = "https://9w3707plqb.execute-api.ap-northeast-2.amazonaws.com/auth"; // 실제 API Gateway URL

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // 에러 메시지 초기화

    try {
      const hashedPassword = md5(password).toString(); // 패스워드를 MD5로 해싱
      const response = await axios.post(AUTH_API_URL, { id, password: hashedPassword }); // 해싱된 패스워드 전송

      if (response.status === 200) {
        onLoginSuccess();
      } else {
        // 200이 아닌 다른 성공 코드 (예: 201)가 올 경우를 대비
        setError(response.data.message || '인증에 실패했습니다.');
      }
    } catch (err) {
      // 네트워크 오류, 4xx/5xx 에러 등
      if (err.response) {
        // 서버가 응답했지만 상태 코드가 2xx 범위가 아님
        setError(err.response.data.message || '인증에 실패했습니다.');
      } else if (err.request) {
        // 요청이 전송되었지만 응답을 받지 못함
        setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        // 요청 설정 중 오류 발생
        setError('로그인 처리 중 오류가 발생했습니다.');
      }
      console.error("Login error:", err);
    }
  };

  return (
    <Container fluid className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '100vh', backgroundColor: '#ff7300' }}>
      <img
        src={process.env.PUBLIC_URL + "/logo.svg"}
        alt="SEEIK-KIOSK Logo"
        style={{ width: '150px', marginBottom: '20px' }}
      />
      <Card style={{ width: '400px' }}>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group id="id" className="mb-3"> {/* ID 입력 필드 추가 */}
              <Form.Label>아이디</Form.Label>
              <Form.Control
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group id="password">
              <Form.Label>암호</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button type="submit" className="w-100 mt-3" variant="light">로그인</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default LoginPage;
