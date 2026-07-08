import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:3000';

async function apiFetch(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API Error');
  }
  return data;
}

describe('OKR Flow Integration Tests', () => {
  let testRoleId: string;
  let testObjectiveId: string;
  let testKeyResultId: string;
  let testCheckInId: string;

  it('1. Create Role', async () => {
    const roleData = {
      title: 'QA Engineer',
      circleId: 'circle_hr',
      description: 'Test everything',
      accountabilities: ['Write tests', 'Find bugs'],
      userIds: ['usr_hr_2']
    };

    const result = await apiFetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData)
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe('QA Engineer');
    testRoleId = result.id;
  });

  it('2. Create Objective', async () => {
    const objData = {
      title: 'Achieve 100% Test Coverage',
      level: 'circle',
      circleId: 'circle_hr',
      parentId: null,
      targetQuarter: 'Q2 2026',
      okrType: 'committed'
    };

    const result = await apiFetch('/api/objectives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(objData)
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBe('Achieve 100% Test Coverage');
    testObjectiveId = result.id;
  });

  it('3. Create Key Result', async () => {
    const krData = {
      objectiveId: testObjectiveId,
      title: 'Write unit tests for all schemas',
      targetValue: 100,
      currentValue: 0,
      unit: '%',
      isShared: true,
      assignees: [{
        circleId: 'circle_hr',
        roleId: testRoleId,
        weightPercentage: 100,
        currentProgress: 0
      }]
    };

    const result = await apiFetch('/api/key-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(krData)
    });

    expect(result).toBeDefined();
    expect(result.keyResult).toBeDefined();
    expect(result.keyResult.id).toBeDefined();
    expect(result.keyResult.title).toBe('Write unit tests for all schemas');
    testKeyResultId = result.keyResult.id;
  });

  it('4. Submit Check-In', async () => {
    const checkInData = {
      keyResultId: testKeyResultId,
      assigneeId: 'usr_hr_2',
      roleId: testRoleId,
      newValue: 50,
      notes: 'Halfway there!',
      hasBlocker: false,
      blockerNotes: null,
      dependencyCircleId: null,
      dependencyRoleId: null
    };

    const result = await apiFetch('/api/check-ins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkInData)
    });

    expect(result).toBeDefined();
    expect(result.checkIn).toBeDefined();
    expect(result.checkIn.id).toBeDefined();
    expect(result.checkIn.newValue).toBe(50);
    testCheckInId = result.checkIn.id;
  });

  it('5. Approve Check-In', async () => {
    const approvalData = {
      approverId: 'usr_dir_1',
      status: 'approved',
      approverNotes: 'Good job so far'
    };

    const result = await apiFetch(`/api/check-ins/${testCheckInId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalData)
    });

    expect(result).toBeDefined();
    expect(result.checkIn).toBeDefined();
    expect(result.checkIn.status).toBe('approved');

    // Also check if the KR's progress was updated
    const krs = await apiFetch('/api/key-results');
    const kr = krs.find((k: any) => k.id === testKeyResultId);
    expect(kr).toBeDefined();
    expect(kr.currentValue).toBe(50);
    expect(kr.progress).toBe(50);
  });

  it('6. Read and Verify Key Results & Check-Ins', async () => {
    const checkIns = await apiFetch('/api/check-ins');
    const logs = checkIns.filter((c: any) => c.keyResultId === testKeyResultId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].status).toBe('approved');
  });

  it('7. Update Key Result Directly', async () => {
    const updateData = {
      currentValue: 100
    };

    const result = await apiFetch(`/api/key-results/${testKeyResultId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    expect(result).toBeDefined();
    expect(result.currentValue).toBe(100);
    expect(result.progress).toBe(100);
  });
});
