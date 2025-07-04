import React, { useState } from 'react';
import type { Event, GalaTable, GalaAuctionItem } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GalaAdminPanelProps {
  event: Event;
  isOrganizer: boolean;
  onEventUpdate?: (event: Event) => void;
}

export const GalaAdminPanel: React.FC<GalaAdminPanelProps> = ({ event, isOrganizer, onEventUpdate }) => {
  // Local state for forms
  const [tables, setTables] = useState<GalaTable[]>(event.tables || []);
  const [auctionItems, setAuctionItems] = useState<GalaAuctionItem[]>(event.auctionItems || []);
  const [donationGoal, setDonationGoal] = useState<number | ''>(event.donationGoal || '');
  const [donationRaised] = useState<number>(event.donationRaised || 0);

  // Table form state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableHost, setNewTableHost] = useState('');
  const [newTableGuests, setNewTableGuests] = useState('');

  // Auction form state
  const [newAuctionName, setNewAuctionName] = useState('');
  const [newAuctionDesc, setNewAuctionDesc] = useState('');
  const [newAuctionStartBid, setNewAuctionStartBid] = useState('');

  // Firestore update helper
  const updateEventField = async (field: string, value: any) => {
    const eventRef = doc(db, 'events', event.id);
    await updateDoc(eventRef, { [field]: value });
    if (onEventUpdate) onEventUpdate({ ...event, [field]: value });
  };

  // Table handlers
  const addTable = async () => {
    if (!newTableNumber) return;
    const table: GalaTable = {
      tableNumber: parseInt(newTableNumber, 10),
      host: newTableHost,
      guests: newTableGuests.split(',').map((g) => g.trim()).filter(Boolean),
    };
    const updatedTables = [...tables, table];
    setTables(updatedTables);
    await updateEventField('tables', updatedTables);
    setNewTableNumber('');
    setNewTableHost('');
    setNewTableGuests('');
  };
  const removeTable = async (tableNumber: number) => {
    const updatedTables = tables.filter((t) => t.tableNumber !== tableNumber);
    setTables(updatedTables);
    await updateEventField('tables', updatedTables);
  };

  // Auction handlers
  const addAuctionItem = async () => {
    if (!newAuctionName || !newAuctionStartBid) return;
    const item: GalaAuctionItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newAuctionName,
      description: newAuctionDesc,
      startingBid: parseFloat(newAuctionStartBid),
      currentBid: parseFloat(newAuctionStartBid),
      highestBidder: '',
    };
    const updatedItems = [...auctionItems, item];
    setAuctionItems(updatedItems);
    await updateEventField('auctionItems', updatedItems);
    setNewAuctionName('');
    setNewAuctionDesc('');
    setNewAuctionStartBid('');
  };
  const removeAuctionItem = async (id: string) => {
    const updatedItems = auctionItems.filter((item) => item.id !== id);
    setAuctionItems(updatedItems);
    await updateEventField('auctionItems', updatedItems);
  };

  // Donation goal handler
  const saveDonationGoal = async () => {
    if (donationGoal === '') return;
    await updateEventField('donationGoal', Number(donationGoal));
  };

  if (!isOrganizer) {
    return <p className="text-gray-500">You do not have permission to manage this event.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Table Management */}
      <section>
        <h2 className="text-lg font-bold mb-2">Manage Tables</h2>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Table Number"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            type="number"
            min={1}
          />
          <Input
            placeholder="Host Name"
            value={newTableHost}
            onChange={(e) => setNewTableHost(e.target.value)}
          />
          <Input
            placeholder="Guests (comma separated)"
            value={newTableGuests}
            onChange={(e) => setNewTableGuests(e.target.value)}
          />
          <Button onClick={addTable}>Add Table</Button>
        </div>
        <ul>
          {tables.map((table) => (
            <li key={table.tableNumber} className="mb-1 flex items-center gap-2">
              <span>Table {table.tableNumber} (Host: {table.host || 'N/A'}) - Guests: {table.guests.join(', ')}</span>
              <Button size="sm" variant="destructive" onClick={() => removeTable(table.tableNumber)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Auction Item Management */}
      <section>
        <h2 className="text-lg font-bold mb-2">Manage Auction Items</h2>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Item Name"
            value={newAuctionName}
            onChange={(e) => setNewAuctionName(e.target.value)}
          />
          <Input
            placeholder="Description"
            value={newAuctionDesc}
            onChange={(e) => setNewAuctionDesc(e.target.value)}
          />
          <Input
            placeholder="Starting Bid"
            value={newAuctionStartBid}
            onChange={(e) => setNewAuctionStartBid(e.target.value)}
            type="number"
            min={0}
          />
          <Button onClick={addAuctionItem}>Add Item</Button>
        </div>
        <ul>
          {auctionItems.map((item) => (
            <li key={item.id} className="mb-1 flex items-center gap-2">
              <span>{item.name} (${item.startingBid}) - {item.description}</span>
              <Button size="sm" variant="destructive" onClick={() => removeAuctionItem(item.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Donation Goal Management */}
      <section>
        <h2 className="text-lg font-bold mb-2">Donation Goal</h2>
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Donation Goal"
            value={donationGoal}
            onChange={(e) => setDonationGoal(e.target.value === '' ? '' : Number(e.target.value))}
            type="number"
            min={0}
          />
          <Button onClick={saveDonationGoal}>Save</Button>
        </div>
        <p className="text-sm text-gray-700 mt-1">Current Goal: ${event.donationGoal || 0} | Raised: ${donationRaised}</p>
      </section>
    </div>
  );
}; 
