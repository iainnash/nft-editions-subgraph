import { CreatedEdition } from "../generated/SingleEditionMintableCreator/SingleEditionMintableCreator";
import { NFTEdition, TransactionInfo } from "../generated/schema";
import { NFTEdition as NFTEditionTemplate } from "../generated/templates";
import {
  NFTEdition as NFTEditionContract,
  OwnershipTransferred,
  PriceChanged,
} from "../generated/templates/NFTEdition/NFTEdition";
import { Address, ethereum } from "@graphprotocol/graph-ts";

function makeTransaction(txn: ethereum.Event): string {
  const txnInfo = new TransactionInfo(txn.transaction.hash.toHex());
  txnInfo.block = txn.block.number;
  txnInfo.timestamp = txn.block.timestamp;
  txnInfo.save();

  return txnInfo.id;
}

function setupEdition(edition: NFTEdition, address: Address): void {
  const editionContract = NFTEditionContract.bind(address);

  const uris = editionContract.getURIs();
  edition.animationURI = uris.value0;
  edition.animationHash = uris.value1;
  edition.imageURI = uris.value2;
  edition.imageHash = uris.value3;

  edition.name = editionContract.name();
  edition.symbol = editionContract.symbol();
  edition.salePrice = editionContract.salePrice();
}

export function handleCreatedEdition(event: CreatedEdition): void {
  const newEdition = new NFTEdition(
    event.params.editionContractAddress.toHex()
  );
  newEdition.address = event.params.editionContractAddress;
  newEdition.editionSize = event.params.editionSize;
  newEdition.editionId = event.params.editionId;
  newEdition.creator = event.transaction.from;

  newEdition.txn = makeTransaction(event);

  NFTEditionTemplate.create(event.params.editionContractAddress);

  setupEdition(newEdition, event.params.editionContractAddress);

  newEdition.save();
}

export function handleInitEdition(event: OwnershipTransferred): void {
  const edition = NFTEdition.load(event.address.toHex())!;
  setupEdition(edition, event.address);
  edition.save();
}

export function handleEditionPriceChanged(event: PriceChanged): void {
  const edition = NFTEdition.load(event.address.toHex())!;
  edition.salePrice = event.params.amount;
  edition.save();
}
