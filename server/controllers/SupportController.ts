import { Request, Response } from 'express';
import SupportTicket, { ISupportTicket } from '../models/SupportTicket';
import { IUser } from '../models/User';

export class SupportController {
  // Create a support ticket
  static async createTicket(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { subject, category, message } = req.body;

      const ticket = new SupportTicket({
        userId: user._id,
        subject,
        category,
        message,
        status: 'open'
      });

      await ticket.save();
      
      // Populate user information
      await ticket.populate('userId', 'username email firstName lastName');
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Failed to create support ticket' });
    }
  }

  // Get user tickets
  static async getUserTickets(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { page = 1, limit = 10, status } = req.query;

      const filter: any = { userId: user._id };
      if (status) {
        filter.status = status;
      }

      const tickets = await SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('userId', 'username email firstName lastName');

      const total = await SupportTicket.countDocuments(filter);

      res.json({
        tickets,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ error: 'Failed to get support tickets' });
    }
  }

  // Get single ticket
  static async getTicket(req: Request, res: Response) {
    try {
      const user = req.user as IUser;
      const { ticketId } = req.params;

      const ticket = await SupportTicket.findOne({
        _id: ticketId,
        userId: user._id
      }).populate('userId', 'username email firstName lastName');

      if (!ticket) {
        return res.status(404).json({ error: 'Support ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ error: 'Failed to get support ticket' });
    }
  }

  // Update ticket status (admin only)
  static async updateTicketStatus(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;

      const ticket = await SupportTicket.findByIdAndUpdate(
        ticketId,
        { status },
        { new: true, runValidators: true }
      ).populate('userId', 'username email firstName lastName');

      if (!ticket) {
        return res.status(404).json({ error: 'Support ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Update ticket status error:', error);
      res.status(500).json({ error: 'Failed to update ticket status' });
    }
  }

  // Get all tickets (admin only)
  static async getAllTickets(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, category } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (category) filter.category = category;

      const tickets = await SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('userId', 'username email firstName lastName');

      const total = await SupportTicket.countDocuments(filter);

      res.json({
        tickets,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Get all tickets error:', error);
      res.status(500).json({ error: 'Failed to get support tickets' });
    }
  }
}

export default SupportController;