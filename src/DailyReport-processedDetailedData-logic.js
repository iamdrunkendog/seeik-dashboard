        console.log("dailyReportData (in processedDetailedData useMemo):", dailyReportData);
        const data = [];
        let currentStore = null;
        let storeSubtotalMonthly = 0;
        let storeSubtotalEstimated = 0;
        let storeSubtotalDaily = {}; // 일별 소계를 위한 객체
        let storeColorIndex = 0; // 0 또는 1

        let grandTotalMonthly = 0;
        let grandTotalEstimated = 0;
        let grandTotalDaily = {}; // 일별 총계를 위한 객체

        // daysInMonth 배열을 기반으로 일별 합계 객체 초기화
        daysInMonth.forEach(day => {
            storeSubtotalDaily[day] = 0;
            grandTotalDaily[day] = 0;
        });

        const sortedData = [...dailyReportData].sort((a, b) => a.store_name.localeCompare(b.store_name));

        sortedData.forEach((item, index) => {
            // 점포 변경 시 소계 추가
            if (currentStore && item.store_name !== currentStore) {
                data.push({
                    type: 'subtotal',
                    store_name: currentStore,
                    monthly_total: storeSubtotalMonthly,
                    estimated_monthly: storeSubtotalEstimated,
                    daily_sales_sum: { ...storeSubtotalDaily }, // 현재까지의 일별 소계 복사
                    colorIndex: storeColorIndex,
                });
                // 다음 점포를 위해 색상 인덱스 토글
                storeColorIndex = 1 - storeColorIndex;
                storeSubtotalMonthly = 0;
                storeSubtotalEstimated = 0;
                daysInMonth.forEach(day => storeSubtotalDaily[day] = 0); // 일별 소계 초기화
            }

            // 현재 점포 업데이트
            currentStore = item.store_name;

            // 데이터 행 추가
            data.push({
                type: 'data',
                ...item,
                colorIndex: storeColorIndex,
            });

            // 소계 업데이트
            storeSubtotalMonthly += Number(item.monthly_total);
            storeSubtotalEstimated += Number(item.estimated_monthly);
            // 일별 소계 업데이트
            daysInMonth.forEach(day => {
                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                storeSubtotalDaily[day] += (item.daily_sales[dateKey] || 0);
            });

            // 총계 업데이트
            grandTotalMonthly += Number(item.monthly_total);
            grandTotalEstimated += Number(item.estimated_monthly);
            // 일별 총계 업데이트
            daysInMonth.forEach(day => {
                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                grandTotalDaily[day] += (item.daily_sales[dateKey] || 0);
            });
        });

        // 마지막 점포의 소계 추가
        if (currentStore) {
            data.push({
                type: 'subtotal',
                store_name: currentStore,
                monthly_total: storeSubtotalMonthly,
                estimated_monthly: storeSubtotalEstimated,
                daily_sales_sum: { ...storeSubtotalDaily },
                colorIndex: storeColorIndex,
            });
        }

        // 총계 행 추가 (가장 위에 표시하기 위해 나중에 unshift)
        data.unshift({
            type: 'grandtotal',
            monthly_total: grandTotalMonthly,
            estimated_monthly: grandTotalEstimated,
            daily_sales_sum: { ...grandTotalDaily },
        });

        return data;