import { CostProposal } from '../types/cost-proposal';

export const MOCK_COST_PROPOSALS: CostProposal[] = [
  {
    "code": "DX2609-0009",
    "title": "Chi phí quảng cáo số và tiếp thị trực tuyến",
    "proposalDate": "23/09/2026",
    "dueDate": "23/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "Vietcombank - Tài khoản chính",
    "beneficiary": "Công ty CP Quảng Cáo Số 1",
    "amount": 3560000,
    "isOverBudget": false,
    "overBudgetReason": "",
    "approvalStatus": "pending",
    "status": "draft",
    "reason": "Chi phí chạy thử nghiệm chiến dịch marketing số.",
    "lineItems": [
      {
        "id": "li-init-1",
        "category": "Quảng cáo",
        "description": "Quảng cáo Facebook",
        "quantity": 1,
        "unitPrice": 1330000,
        "amount": 1330000,
        "note": ""
      },
      {
        "id": "li-1790145346620",
        "category": "Điện nước & Dịch vụ",
        "description": "Dịch vụ phụ trợ marketing",
        "quantity": 1,
        "unitPrice": 2230000,
        "amount": 2230000,
        "note": ""
      }
    ],
    "id": "9",
    "updatedAt": "23/09/2026"
  },
  {
    "code": "DX2609-0008",
    "title": "Đề xuất chi phí tiếp khách",
    "proposalDate": "23/09/2026",
    "dueDate": "23/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "Vietcombank - Tài khoản chính",
    "beneficiary": "Nhà hàng Hoàng Yến",
    "amount": 3500000,
    "isOverBudget": false,
    "overBudgetReason": "",
    "approvalStatus": "pending",
    "status": "draft",
    "reason": "Tiếp đối tác triển khai phần mềm CRM.",
    "lineItems": [
      {
        "id": "li-init-1",
        "category": "Tiếp khách",
        "description": "Tiếp khách đối tác CRM",
        "quantity": 1,
        "unitPrice": 3500000,
        "amount": 3500000,
        "note": ""
      }
    ],
    "id": "8",
    "updatedAt": "23/09/2026"
  },
  {
    "code": "DX2609-0007",
    "title": "Chi phí mua sắm bàn ghế làm việc đợt 3/2026",
    "proposalDate": "23/09/2026",
    "dueDate": "25/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "1121 - Tiền gửi ngân hàng Techcombank",
    "beneficiary": "Công ty TNHH Nội Thất Hòa Phát",
    "amount": 15400000,
    "isOverBudget": false,
    "overBudgetReason": "",
    "approvalStatus": "pending",
    "status": "draft",
    "reason": "Trang bị thêm 10 bộ bàn làm việc nhân viên phục vụ mở rộng văn phòng tầng 4.",
    "lineItems": [
      {
        "name": "Bàn làm việc cụm 4 chỗ",
        "quantity": 2,
        "unitPrice": 4200000,
        "total": 8400000
      },
      {
        "name": "Ghế xoay lưới công thái học",
        "quantity": 10,
        "unitPrice": 700000,
        "total": 7000000
      }
    ],
    "id": "7",
    "updatedAt": "23/09/2026"
  },
  {
    "code": "DX2609-0006",
    "title": "Thanh toán chi phí truyền thông & marketing Q3",
    "proposalDate": "22/09/2026",
    "dueDate": "28/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "1121 - Tiền gửi ngân hàng Techcombank",
    "beneficiary": "Meta Platforms Ireland",
    "amount": 45000000,
    "isOverBudget": true,
    "overBudgetReason": "Bổ sung ngân sách chiến dịch khuyến mãi kỷ niệm 10 năm thành lập công ty.",
    "approvalStatus": "pending",
    "status": "draft",
    "reason": "Chạy quảng cáo Facebook Ads, Google Ads tăng nhận diện thương hiệu.",
    "lineItems": [
      {
        "name": "Facebook Ads",
        "quantity": 1,
        "unitPrice": 25000000,
        "total": 25000000
      },
      {
        "name": "Google Search Ads",
        "quantity": 1,
        "unitPrice": 20000000,
        "total": 20000000
      }
    ],
    "id": "6",
    "updatedAt": "22/09/2026"
  },
  {
    "code": "DX2609-0005",
    "title": "Chi phí gia hạn bản quyền phần mềm Microsoft 365 & Google Workspace",
    "proposalDate": "20/09/2026",
    "dueDate": "25/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "1122 - Tiền gửi ngân hàng Vietcombank",
    "beneficiary": "Công ty Cổ phần Mật Mã & Phần Mềm",
    "amount": 18500000,
    "isOverBudget": false,
    "overBudgetReason": "",
    "approvalStatus": "approved",
    "status": "draft",
    "reason": "Gia hạn gói tài khoản cho 50 nhân sự trong 12 tháng tiếp theo.",
    "lineItems": [
      {
        "name": "Gói Microsoft 365 Business",
        "quantity": 30,
        "unitPrice": 350000,
        "total": 10500000
      },
      {
        "name": "Gói Google Workspace Business",
        "quantity": 20,
        "unitPrice": 400000,
        "total": 8000000
      }
    ],
    "id": "5",
    "updatedAt": "20/09/2026"
  },
  {
    "code": "DX2609-0004",
    "title": "Tiền thuê văn phòng trụ sở chính tháng 10/2026",
    "proposalDate": "18/09/2026",
    "dueDate": "30/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "1121 - Tiền gửi ngân hàng Techcombank",
    "beneficiary": "Tòa nhà Landmark Building",
    "amount": 85000000,
    "isOverBudget": false,
    "overBudgetReason": "",
    "approvalStatus": "approved",
    "status": "draft",
    "reason": "Thanh toán tiền thuê định kỳ theo hợp đồng thuê số HĐ-01/2024.",
    "lineItems": [
      {
        "name": "Tiền thuê sàn tầng 12 (350m2)",
        "quantity": 1,
        "unitPrice": 75000000,
        "total": 75000000
      },
      {
        "name": "Phí dịch vụ & quản lý tòa nhà",
        "quantity": 1,
        "unitPrice": 10000000,
        "total": 10000000
      }
    ],
    "id": "4",
    "updatedAt": "18/09/2026"
  },
  {
    "code": "DX2609-0003",
    "title": "Chi phí tiếp khách đoàn đối tác Nhật Bản",
    "proposalDate": "15/09/2026",
    "dueDate": "16/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "1111 - Tiền mặt tại quỹ",
    "beneficiary": "Nhà hàng Tokyo Sushi Garden",
    "amount": 6800000,
    "isOverBudget": false,
    "overBudgetReason": "",
    "approvalStatus": "approved",
    "status": "draft",
    "reason": "Tiếp đón và làm việc với Giám đốc công ty Sumitomo về dự án hợp tác.",
    "lineItems": [
      {
        "name": "Set ăn ngoại giao & phòng VIP",
        "quantity": 1,
        "unitPrice": 6800000,
        "total": 6800000
      }
    ],
    "id": "3",
    "updatedAt": "15/09/2026"
  },
  {
    "code": "DX2609-0002",
    "title": "Tạm ứng chi phí công tác Đà Nẵng khảo sát thị trường",
    "proposalDate": "10/09/2026",
    "dueDate": "12/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "1111 - Tiền mặt tại quỹ",
    "beneficiary": "Nguyễn Văn Hải (Trưởng phòng KD)",
    "amount": 12000000,
    "isOverBudget": false,
    "overBudgetReason": "",
    "approvalStatus": "approved",
    "status": "draft",
    "reason": "Khảo sát mặt bằng và gặp gỡ đối tác mở chi nhánh miền Trung (3 ngày).",
    "lineItems": [
      {
        "name": "Vé máy bay khứ hồi (2 người)",
        "quantity": 2,
        "unitPrice": 3200000,
        "total": 6400000
      },
      {
        "name": "Khách sạn 3 đêm",
        "quantity": 3,
        "unitPrice": 1200000,
        "total": 3600000
      },
      {
        "name": "Phụ cấp công tác & đi lại",
        "quantity": 2,
        "unitPrice": 1000000,
        "total": 2000000
      }
    ],
    "id": "2",
    "updatedAt": "10/09/2026"
  },
  {
    "code": "DX2609-0001",
    "title": "Mua quà tặng tri ân khách hàng thân thiết VIP",
    "proposalDate": "05/09/2026",
    "dueDate": "08/09/2026",
    "proposer": "Lê Minh Công",
    "department": "Ban Giám Đốc",
    "account": "1121 - Tiền gửi ngân hàng Techcombank",
    "beneficiary": "Công ty Cổ phần Quà Tặng Doanh Nghiệp Việt",
    "amount": 25000000,
    "isOverBudget": true,
    "overBudgetReason": "Số lượng khách hàng VIP nâng hạng trong tháng 8 tăng vượt dự kiến.",
    "approvalStatus": "approved",
    "status": "draft",
    "reason": "Chuẩn bị 50 phần quà cao cấp gửi tặng đối tác dịp Trung Thu.",
    "lineItems": [
      {
        "name": "Hộp quà cao cấp đặc biệt",
        "quantity": 50,
        "unitPrice": 500000,
        "total": 25000000
      }
    ],
    "id": "1",
    "updatedAt": "05/09/2026"
  }
];
