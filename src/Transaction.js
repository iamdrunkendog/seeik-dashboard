import React, { useState, useEffect, useCallback } from 'react';
import { Container, Form, Button, Table, Spinner, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { getTodayString, formatDate, formatNumber, formatDateTime } from './utils/dateUtils';

function Transaction() {
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStores, setSelectedStores] = useState(['BLUESQUARE', 'GSartcenter']); // 기본값: 둘 다 선택
  const [showOnlySuspicious, setShowOnlySuspicious] = useState(false);

  const API_BASE_URL = 'https://9w3707plqb.execute-api.ap-northeast-2.amazonaws.com/default/orders/search';
  const BRAND_COLOR = '#FF7300';
  const storeOptions = ['BLUESQUARE', 'GSartcenter']; // 모든 상점 이름

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const allTransactions = [];
      // 선택된 상점이 없으면 API 호출하지 않음
      if (selectedStores.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const fetchPromises = selectedStores.map(async (store) => { // selectedStores 사용
        const response = await axios.get(API_BASE_URL, {
          params: {
            store_name: store,
            start_date: startDate,
            end_date: endDate,
            summary: 'false'
          },
        });
        return response.data;
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(data => allTransactions.push(...data));

      // created_at (또는 order_date) 기준으로 내림차순 정렬
      allTransactions.sort((a, b) => {
        const dateA = new Date(a.created_at || a.order_date);
        const dateB = new Date(b.created_at || b.order_date);
        return dateB - dateA;
      });

      setTransactions(allTransactions.map((currentTx, index, arr) => {
        const nextTx = arr[index + 1];
        let isErrorSuspected = false;
        let remark = '';

        if (nextTx) {
          const currentCreated = new Date(currentTx.created_at || currentTx.order_date).getTime();
          const nextCreated = new Date(nextTx.created_at || nextTx.order_date).getTime();
          const timeDiff = Math.abs(currentCreated - nextCreated); // 밀리초 단위 차이

          if (
            currentTx.store_name === nextTx.store_name &&
            currentTx.photo_detail_type === nextTx.photo_detail_type &&
            timeDiff <= 20 * 1000 // 20초 이내
          ) {
            isErrorSuspected = true;
            remark = '오류의심';
          }
        }
        return { ...currentTx, isErrorSuspected, remark };
      }));
    } catch (err) {
      setError('트랜잭션 데이터를 불러오는 데 실패했습니다.');
      console.error(err);
      setTransactions([]);
    }
    setLoading(false);
  }, [startDate, endDate, selectedStores]); // selectedStores를 의존성 배열에 추가

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleStoreToggle = (value) => {
    const newSelectedStores = selectedStores.includes(value)
      ? selectedStores.filter(store => store !== value)
      : [...selectedStores, value];
    setSelectedStores(newSelectedStores);
  };

  const filteredTransactions = transactions.filter(
    (transaction) => !showOnlySuspicious || transaction.isErrorSuspected
  );

  return (
    <Container className="mt-4">
      <h2>트랜잭션</h2>

      <div className="mb-4">
        {storeOptions.map((name) => (
          <Form.Check
            inline
            key={name}
            type="checkbox"
            id={`store-${name}`}
            label={name}
            checked={selectedStores.includes(name)}
            onChange={() => handleStoreToggle(name)}
          />
        ))}
        <Form.Check
          inline
          type="checkbox"
          id="filter-suspicious"
          label="오류 의심건만 보기"
          checked={showOnlySuspicious}
          onChange={(e) => setShowOnlySuspicious(e.target.checked)}
          className="ms-3"
        />
      </div>

      <Form onSubmit={handleSearch} className="mb-4 p-4 border rounded bg-light">
        <Row className="gy-3 align-items-center">
          <Col md={6} lg={4}>
            <Form.Group controlId="transactionStartDate">
              <Form.Label className="mt-2">시작일</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="transactionEndDate">
              <Form.Label className="mt-2">종료일</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
          <Col lg={2} className="d-flex align-items-end mt-auto">
            <Button variant="primary" type="submit" disabled={loading} className="w-100" style={{ backgroundColor: BRAND_COLOR, borderColor: BRAND_COLOR }}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : '조회'}
            </Button>
          </Col>
        </Row>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>상점 이름</th>
            <th>결제 금액</th>
            <th>사진 상세 유형</th>
            <th>생성 시간</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" className="text-center"><Spinner/></td>
            </tr>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <tr key={transaction.order_id || transaction.created_at} style={{ backgroundColor: transaction.isErrorSuspected ? '#FFDDDD' : '' }}> {/* 오류 의심 시 옅은 붉은색 배경 */}
                <td style={{ color: transaction.isErrorSuspected ? 'red' : '' }}>{transaction.store_name}</td>
                <td style={{ color: transaction.isErrorSuspected ? 'red' : '' }}>₩ {formatNumber(transaction.payment_amount || transaction.total_sales)}</td>
                <td style={{ color: transaction.isErrorSuspected ? 'red' : '' }}>{transaction.photo_detail_type || 'N/A'}</td>
                <td style={{ color: transaction.isErrorSuspected ? 'red' : '' }}>{formatDateTime(transaction.created_at)}</td>
                <td style={{ color: transaction.isErrorSuspected ? 'red' : '' }}>
                  {transaction.remark === '오류의심' ? (
                    <span style={{ color: 'red', fontWeight: 'bold' }}>{transaction.remark}</span>
                  ) : (
                    transaction.remark
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                {showOnlySuspicious ? '오류 의심 내역이 없습니다.' : '조회된 트랜잭션 데이터가 없습니다.'}
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default Transaction;
