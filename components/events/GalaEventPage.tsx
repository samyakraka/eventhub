import React from 'react';
import type { Event, GalaInvitee, GalaPerformer, GalaProgramItem } from '@/types';
import { useAuth } from '../contexts/AuthContext';

interface GalaEventPageProps {
  event: Event;
}

export const GalaEventPage: React.FC<GalaEventPageProps> = ({ event }) => {
  const tables = event.tables;
  const auctionItems = event.auctionItems;
  const donationGoal = event.donationGoal;
  const donationRaised = event.donationRaised;
  const { user } = useAuth();
  const isOrganizer = user && event.organizerUid === user.uid;
  const isInvitee = user && event.invitees?.some((i: GalaInvitee) => i.email === user.email);

  return (
    <div className="space-y-8">
      {/* Table Map */}
      <section>
        <h2 className="text-xl font-bold mb-2">Table Assignments</h2>
        {tables && tables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map((table) => (
              <div key={table.tableNumber} className="border rounded-lg p-4 bg-white/80">
                <h3 className="font-semibold">Table {table.tableNumber}</h3>
                <p className="text-sm">Host: {table.host || 'N/A'}</p>
                <ul className="mt-2 text-sm text-gray-700">
                  {table.guests.map((guest, idx) => (
                    <li key={idx}>- {guest}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tables assigned yet.</p>
        )}
      </section>

      {/* Auction Panel */}
      <section>
        <h2 className="text-xl font-bold mb-2">Live Auction</h2>
        {auctionItems && auctionItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auctionItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-white/80">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm mb-1">{item.description}</p>
                <p className="text-sm">Starting Bid: ${item.startingBid}</p>
                <p className="text-sm font-bold">Current Bid: ${item.currentBid || item.startingBid}</p>
                <p className="text-xs text-gray-600">Highest Bidder: {item.highestBidder || 'None'}</p>
                <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" disabled>
                  Place Bid (Coming Soon)
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No auction items available yet.</p>
        )}
      </section>

      {/* Donation Tracker */}
      <section>
        <h2 className="text-xl font-bold mb-2">Donation Progress</h2>
        {donationGoal && donationRaised !== undefined ? (
          <>
            <div className="w-full bg-gray-200 rounded-full h-6 mb-2">
              <div
                className="bg-green-500 h-6 rounded-full text-white text-center text-sm flex items-center justify-center"
                style={{ width: `${Math.min((donationRaised / donationGoal) * 100, 100)}%` }}
              >
                ${donationRaised} raised
              </div>
            </div>
            <p className="text-sm text-gray-700">Goal: ${donationGoal}</p>
          </>
        ) : (
          <p className="text-gray-500">Donation goal not set.</p>
        )}
      </section>

      {/* Invitees (only for organizer or invitee) */}
      {(isOrganizer || isInvitee) && event.invitees && event.invitees.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Invitees</h3>
          <ul>
            {event.invitees.map((invitee: GalaInvitee) => (
              <li key={invitee.email} className="mb-1">
                {invitee.name} ({invitee.email}){' '}
                {invitee.isVIP && <span className="text-yellow-600 font-bold">VIP</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Performers / Speakers */}
      {event.performers && event.performers.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Performers / Speakers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.performers.map((p: GalaPerformer) => (
              <div key={p.name} className="border rounded p-4 flex gap-4 items-center">
                {p.photoUrl && <img src={p.photoUrl} alt={p.name} className="w-16 h-16 rounded-full object-cover" />}
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">{p.role}</div>
                  {p.bio && <div className="text-xs mt-1">{p.bio}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Program Schedule */}
      {event.programSchedule && event.programSchedule.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2">Program Schedule</h3>
          <ul className="border-l-2 border-gray-300 pl-4">
            {event.programSchedule.map((item: GalaProgramItem) => (
              <li key={item.title} className="mb-4 relative">
                <div className="absolute -left-3 top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="font-semibold">{item.time} - {item.title}</div>
                {item.description && <div className="text-sm text-gray-600">{item.description}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 
