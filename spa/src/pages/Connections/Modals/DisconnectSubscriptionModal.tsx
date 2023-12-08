import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from "@atlaskit/modal-dialog";
import Button from "@atlaskit/button";
import { SuccessfulConnection } from "../../../../../src/rest-interfaces";

/**
 * NOTE: While testing in dev mode, please disable the React.StrictMode first,
 * otherwise this modal won't show up.
 */
const DisconnectSubscriptionModal = ({ subscription, setIsModalOpened }: {
	subscription: SuccessfulConnection,
	setIsModalOpened: (x: boolean) => void
}) => {
	const disconnect = () => {
		// TODO: API call to disconnect this subscription
		console.log("Disconnect", subscription.account.login);
		setIsModalOpened(false);
	};

	return (
		<>
			<Modal onClose={() => setIsModalOpened(false)}>
				<ModalHeader>
					<ModalTitle appearance="warning">
						<>Disconnect {subscription.account.login}?</>
					</ModalTitle>
				</ModalHeader>
				<ModalBody>
					<p data-testid="disconnect-content">
						Are you sure you want to disconnect your organization <b>{subscription.account.login}</b>?
						This means that you will have to redo the backfill of historical data if you ever want to reconnect
					</p>
				</ModalBody>
				<ModalFooter>
					<Button appearance="subtle" onClick={() => setIsModalOpened(false)}>Cancel</Button>
					<Button appearance="danger" onClick={disconnect}>
						Disconnect
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default  DisconnectSubscriptionModal;