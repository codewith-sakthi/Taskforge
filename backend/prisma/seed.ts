import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const getTodayDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function main() {
  console.log('🌱 Starting TeamPulse database seed...');

  // Clean existing tables (order matters for foreign keys)
  await prisma.notification.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.taskUpdate.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.checkIn.deleteMany({});
  await prisma.systemSetting.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'teamName', value: 'TeamPulse Engineering & Product' },
      { key: 'checkInThresholdHours', value: '8' },
      { key: 'emailNotifications', value: 'true' },
      { key: 'timezone', value: 'Asia/Kolkata' },
    ],
  });

  // 2. Passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const memberPasswordHash = await bcrypt.hash('Member@123', 10);

  // 3. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@teampulse.local',
      phone: '+91 98765 43210',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Admin user created: admin@teampulse.local (Password: Admin@123)');

  // 4. Create 3 Demo Members
  const sakthi = await prisma.user.create({
    data: {
      name: 'Sakthi Vadivelan',
      email: 'sakthi@example.com',
      phone: '+91 98401 23456',
      passwordHash: memberPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  const naveen = await prisma.user.create({
    data: {
      name: 'Naveen Kumar',
      email: 'naveen@example.com',
      phone: '+91 98402 34567',
      passwordHash: memberPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98403 45678',
      passwordHash: memberPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Demo team members created:');
  console.log('   - sakthi@example.com (Password: Member@123)');
  console.log('   - naveen@example.com (Password: Member@123)');
  console.log('   - rahul@example.com (Password: Member@123)');

  // 5. Create Check-Ins
  const today = new Date();
  const todayStr = getTodayDateString(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getTodayDateString(yesterday);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = getTodayDateString(twoDaysAgo);

  // Sakthi: Checked in today at 09:12 AM, not checked out (ACTIVE)
  const sakthiTodayCheckin = new Date();
  sakthiTodayCheckin.setHours(9, 12, 0, 0);

  await prisma.checkIn.create({
    data: {
      userId: sakthi.id,
      date: todayStr,
      checkInTime: sakthiTodayCheckin,
      status: 'ACTIVE',
    },
  });

  // Naveen: Checked in today at 08:45 AM, checked out at 05:10 PM (COMPLETED)
  const naveenTodayCheckin = new Date();
  naveenTodayCheckin.setHours(8, 45, 0, 0);
  const naveenTodayCheckout = new Date();
  naveenTodayCheckout.setHours(17, 10, 0, 0);

  await prisma.checkIn.create({
    data: {
      userId: naveen.id,
      date: todayStr,
      checkInTime: naveenTodayCheckin,
      checkOutTime: naveenTodayCheckout,
      status: 'COMPLETED',
    },
  });

  // Rahul: Checked in yesterday at 09:30 AM, checked out at 06:00 PM (OFFLINE today)
  const rahulYesterdayCheckin = new Date(yesterday);
  rahulYesterdayCheckin.setHours(9, 30, 0, 0);
  const rahulYesterdayCheckout = new Date(yesterday);
  rahulYesterdayCheckout.setHours(18, 0, 0, 0);

  await prisma.checkIn.create({
    data: {
      userId: rahul.id,
      date: yesterdayStr,
      checkInTime: rahulYesterdayCheckin,
      checkOutTime: rahulYesterdayCheckout,
      status: 'COMPLETED',
    },
  });

  // Past check-ins for weekly trends
  await prisma.checkIn.createMany({
    data: [
      {
        userId: sakthi.id,
        date: yesterdayStr,
        checkInTime: new Date(yesterday.setHours(9, 15, 0, 0)),
        checkOutTime: new Date(yesterday.setHours(18, 30, 0, 0)),
        status: 'COMPLETED',
      },
      {
        userId: naveen.id,
        date: yesterdayStr,
        checkInTime: new Date(yesterday.setHours(9, 0, 0, 0)),
        checkOutTime: new Date(yesterday.setHours(17, 45, 0, 0)),
        status: 'COMPLETED',
      },
      {
        userId: sakthi.id,
        date: twoDaysAgoStr,
        checkInTime: new Date(twoDaysAgo.setHours(9, 5, 0, 0)),
        checkOutTime: new Date(twoDaysAgo.setHours(17, 50, 0, 0)),
        status: 'COMPLETED',
      },
      {
        userId: rahul.id,
        date: twoDaysAgoStr,
        checkInTime: new Date(twoDaysAgo.setHours(9, 40, 0, 0)),
        checkOutTime: new Date(twoDaysAgo.setHours(18, 15, 0, 0)),
        status: 'COMPLETED',
      },
    ],
  });
  console.log('✅ Sample check-in records seeded');

  // 6. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Website UI Design & Theme System',
      description: 'Design and build the responsive dashboard UI components with high fidelity styling and dark-mode friendly tokens.',
      assignedTo: sakthi.id,
      createdBy: admin.id,
      priority: 'HIGH',
      category: 'Design & Frontend',
      status: 'IN_PROGRESS',
      progress: 80,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'RESTful Backend API & Authentication',
      description: 'Implement JWT authentication, role guards, Zod validation, and secure REST endpoints with Express.',
      assignedTo: naveen.id,
      createdBy: admin.id,
      priority: 'URGENT',
      category: 'Backend Architecture',
      status: 'COMPLETED',
      progress: 100,
      startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Real-time Socket.IO Event Synchronizer',
      description: 'Integrate real-time socket events for instant notifications, check-in updates, and task progress broadcast.',
      assignedTo: sakthi.id,
      createdBy: admin.id,
      priority: 'MEDIUM',
      category: 'Realtime Infrastructure',
      status: 'PENDING',
      progress: 20,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Database Schema Optimization & Indexing',
      description: 'Add composite indexes for high-frequency queries and optimize Prisma relation queries for fast analytics.',
      assignedTo: rahul.id,
      createdBy: admin.id,
      priority: 'LOW',
      category: 'Database & DevOps',
      status: 'PENDING',
      progress: 0,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Security Audit & Rate Limiting Enforcement',
      description: 'Audit authentication endpoints against brute force attacks, verify RBAC permissions, and sanitize input.',
      assignedTo: naveen.id,
      createdBy: admin.id,
      priority: 'HIGH',
      category: 'Security & Compliance',
      status: 'IN_PROGRESS',
      progress: 60,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Sample tasks created');

  // 7. Create Task Updates (Timeline)
  await prisma.taskUpdate.createMany({
    data: [
      {
        taskId: task1.id,
        userId: admin.id,
        progress: 0,
        comment: 'Task created and assigned to Sakthi Vadivelan',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        taskId: task1.id,
        userId: sakthi.id,
        progress: 40,
        comment: 'Completed initial wireframes and color palette setup.',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      },
      {
        taskId: task1.id,
        userId: sakthi.id,
        progress: 60,
        comment: 'Responsive navigation and statistics card components ready.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        taskId: task1.id,
        userId: sakthi.id,
        progress: 80,
        comment: 'Completed homepage design and started responsive layout testing.',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        taskId: task2.id,
        userId: naveen.id,
        progress: 100,
        comment: 'All backend endpoints verified and documented with swagger/postman specs.',
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
    ],
  });

  // 8. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'MEMBER_CREATED',
        description: 'Admin created team member Sakthi Vadivelan',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'TASK_CREATED',
        description: 'Admin assigned "Website UI Design & Theme System" to Sakthi',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        userId: sakthi.id,
        action: 'MEMBER_CHECKED_IN',
        description: 'Sakthi checked in for work today at 09:12 AM',
        createdAt: sakthiTodayCheckin,
      },
      {
        userId: naveen.id,
        action: 'MEMBER_CHECKED_IN',
        description: 'Naveen checked in for work today at 08:45 AM',
        createdAt: naveenTodayCheckin,
      },
      {
        userId: sakthi.id,
        action: 'TASK_PROGRESS_CHANGED',
        description: 'Sakthi updated "Website UI Design & Theme System" to 80%',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        userId: naveen.id,
        action: 'MEMBER_CHECKED_OUT',
        description: 'Naveen checked out at 05:10 PM',
        createdAt: naveenTodayCheckout,
      },
    ],
  });

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: sakthi.id,
        title: 'New Task Assigned',
        message: 'You have been assigned: "Website UI Design & Theme System" (Priority: High)',
        isRead: true,
      },
      {
        userId: sakthi.id,
        title: 'Task Deadline Approaching',
        message: 'Your task "Website UI Design & Theme System" is due in 2 days.',
        isRead: false,
      },
      {
        userId: naveen.id,
        title: 'Task Completed',
        message: 'Your task "RESTful Backend API & Authentication" has been marked as completed.',
        isRead: true,
      },
    ],
  });

  console.log('✅ Database seeded successfully with demo data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
